# Sweep — Project Progress & Resume Guide

> Written so a fresh Claude instance can resume with zero prior context.
> Last updated: 2026-06-17

---

## HOW TO RESUME: read this file, then the memory file at
## ~/.claude/projects/.../memory/project_sweep.md

---

## Current state (2026-06-17)

Landing page is BUILT and verified. Needs git push + Vercel deploy.

### Immediate TODOs
1. `git add landing/ classify.py`
2. `git commit -m "Redesign landing page (3-phase curtain) + classifier improvements"`
3. `git push`
4. Deploy landing to Vercel: vercel.com → New Project → import Alex-duh/sweep → Root Directory: `landing` → Deploy
   (Do NOT use npx vercel — version resolution bug on this machine)

---

## Phase 1: CLI tool (COMPLETE)

```bash
python sweep.py --max 20           # dry run default
python sweep.py --max 20 --confirm # plan + prompt
python sweep.py --max 20 --archive # immediate archive
python sweep.py --max 20 --debug   # body preview per email
```

Architecture: auth.py (OAuth) → classify.py (tiered) → sweep.py (main loop)

## Phase 2: Backend (DEPLOYED)

URL: https://sweep-5ubd.onrender.com
- POST /classify  — Groq proxy, returns {label, confidence}
- POST /signup    — SQLite, idempotent
- GET /signups    — view signups

GROQ_API_KEY set in Render dashboard (not in GitHub).

## Phase 3: Landing page (BUILT — landing/)

Three phases:
1. Spam curtain — full-screen canvas of ~50 spam terms in random rotations; drag to sweep them off; at 35/50 swept → auto-scatter + reveal main page
2. Main page — linen + SVG grain texture, SWEEP logo (logo.png 56px pixelated + Playfair Display), centered form, "100 spots" badge, Chrome extension mention
3. Thank-you — explodes college terms on signup, then "You're on the list."

Mobile: tap button instead of drag.
API_BASE = "https://sweep-5ubd.onrender.com" in app.js.
DPR: setTransform(dpr,0,0,dpr,0,0), all drawing uses logW/logH.

## Phase 4: Chrome extension (NOT STARTED)

- chrome.identity.launchWebAuthFlow() (sideloaded — not Web Store)
- Fixed extension ID via manifest "key" field
- classify.js = JS port of classify.py rules
- Groq fallback via backend /classify
- State in chrome.storage.local

---

## Classifier improvements (2026-06-17)

**KEEP_PHRASES** — removed "your enrollment", "your admission" (too broad, fired on Sacred Heart spam)

**COLLEGE_KEYWORDS scope gate** — removed: apply, application, academic, scholarship, major, transfer, degree
(These pulled Pacsun / Morning Brew / UNIQLO "MAJOR deals" / Wendy's into Groq)

**New rule:** admissions-sender + has_unsubscribe → definite recruitment (no Groq needed)
```python
is_admissions_sender = any(w in sender for w in
    ["admissions", "admission", "undergraduateadmissions", "enroll"])
if is_admissions_sender and has_unsubscribe:
    return True
```
Result: 81% rule decisions (was ~30%), avg Groq confidence 97%.

---

## Dead ends — DO NOT RETRY

| Tried | Outcome |
|---|---|
| WebLLM client-side | 1-4GB download, 5-15s per call — unacceptable UX |
| npx vercel CLI | ETARGET: no version matching vercel@54.14.2 |
| ctx.scale(dpr,dpr) on resize | Accumulates → phrases only render in top-left quadrant |
| chrome.identity.getAuthToken | Requires Chrome Web Store publication |
