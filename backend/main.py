import os
import json
import sqlite3
from datetime import datetime, timezone

import httpx
import aiosqlite
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

DB_PATH = "signups.db"


@app.on_event("startup")
async def startup():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """CREATE TABLE IF NOT EXISTS signups (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                name      TEXT,
                email     TEXT UNIQUE,
                timestamp TEXT
            )"""
        )
        await db.commit()


class ClassifyRequest(BaseModel):
    sender: str
    subject: str
    body_preview: str


@app.post("/classify")
async def classify(req: ClassifyRequest):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail={"error": "GROQ_API_KEY not configured"})

    sender, subject, body_preview = req.sender, req.subject, req.body_preview
    prompt = f"""You are helping a user clean their inbox of college recruitment spam.

Classify this email as "recruitment" or "keep":

"recruitment" means: a mass outreach email from a college/university trying to get the user to apply, visit campus, or explore the school. Generic greeting, no specific application context.

"keep" means: anything that is NOT college recruitment — including:
  - Commercial or subscription emails (e.g. "try our premium service", research platforms, paper alerts)
  - Personal emails from a real individual
  - Post-application emails (acceptances, decisions, financial aid)
  - Newsletters or digests not about recruiting the user to apply

Key rule: the sender having a .edu domain does NOT make it recruitment. Academia.edu, ResearchGate, and similar platforms have .edu domains but are commercial services, not colleges recruiting applicants.

Email:
Sender: {sender}
Subject: {subject}
Body preview: {body_preview}

Reply with ONLY this JSON and nothing else:
{{"label": "recruitment" or "keep", "confidence": 0.0 to 1.0}}"""

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0,
                    "max_tokens": 50,
                },
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            )
            resp.raise_for_status()
            result = json.loads(resp.json()["choices"][0]["message"]["content"].strip())
            return {"label": result["label"], "confidence": float(result["confidence"])}
    except Exception:
        return {"label": "keep", "confidence": 0.0}


class SignupRequest(BaseModel):
    name: str
    email: str


@app.post("/signup")
async def signup(req: SignupRequest):
    if not req.email:
        raise HTTPException(status_code=400, detail="email is required")
    timestamp = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        try:
            await db.execute(
                "INSERT INTO signups (name, email, timestamp) VALUES (?, ?, ?)",
                (req.name, req.email, timestamp),
            )
            await db.commit()
        except sqlite3.IntegrityError:
            pass  # duplicate email — idempotent
    return {"success": True}


@app.get("/signups")
async def get_signups():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT name, email, timestamp FROM signups ORDER BY id") as cur:
            rows = await cur.fetchall()
    return {"signups": [dict(r) for r in rows]}
