import asyncio
import json
import os
import sqlite3
from datetime import datetime, timezone

import aiosqlite
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

DB_PATH = "signups.db"
NOTIFY_EMAIL = "da1.alexdu@gmail.com"


@app.get("/health")
async def health():
    return {"status": "ok"}


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
        await db.execute(
            """CREATE TABLE IF NOT EXISTS messages (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                subject   TEXT,
                message   TEXT,
                timestamp TEXT
            )"""
        )
        await db.commit()


async def notify(subject: str, body: str) -> None:
    """Send email via Resend API (HTTPS — works on Render free tier)."""
    api_key = os.environ.get("RESEND_API_KEY", "")
    if not api_key:
        print("[notify] RESEND_API_KEY not set — skipping email")
        return
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "from": "Sweep <onboarding@resend.dev>",
                    "to": [NOTIFY_EMAIL],
                    "subject": subject,
                    "text": body,
                },
            )
            resp.raise_for_status()
            print("[notify] email sent ok")
    except Exception as e:
        print(f"[notify] Resend failed: {e}")


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

    await notify(
        subject=f"[Sweep] New waitlist signup: {req.name}",
        body=f"Name:  {req.name}\nEmail: {req.email}\nTime:  {timestamp}",
    )
    return {"success": True}


@app.get("/signups")
async def get_signups():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT name, email, timestamp FROM signups ORDER BY id") as cur:
            rows = await cur.fetchall()
    return {"signups": [dict(r) for r in rows]}


class ContactRequest(BaseModel):
    subject: str
    message: str


@app.post("/contact")
async def contact(req: ContactRequest):
    if not req.subject.strip() or not req.message.strip():
        raise HTTPException(status_code=400, detail="subject and message are required")
    timestamp = datetime.now(timezone.utc).isoformat()

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO messages (subject, message, timestamp) VALUES (?, ?, ?)",
            (req.subject, req.message, timestamp),
        )
        await db.commit()

    await notify(
        subject=f"[Sweep] Contact: {req.subject}",
        body=f"Subject: {req.subject}\n\n{req.message}\n\nTime: {timestamp}",
    )
    return {"success": True}


class ClassifyRequest(BaseModel):
    sender: str
    subject: str
    body_preview: str


@app.post("/classify")
async def classify(req: ClassifyRequest):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail={"error": "GROQ_API_KEY not configured"})

    prompt = f"""You are helping a user clean their inbox of college recruitment spam.

Classify this email as "recruitment" or "keep":

"recruitment" means: a mass outreach email from a college/university trying to get the user to apply, visit campus, or explore the school. Generic greeting, no specific application context.

"keep" means: anything that is NOT college recruitment — including:
  - Commercial or subscription emails
  - Personal emails from a real individual
  - Post-application emails (acceptances, decisions, financial aid)
  - Newsletters or digests not about recruiting the user to apply

Key rule: the sender having a .edu domain does NOT make it recruitment.

Email:
Sender: {req.sender}
Subject: {req.subject}
Body preview: {req.body_preview}

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
