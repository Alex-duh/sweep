# Sweep — Project Progress & Resume Guide

> Written so a fresh Claude instance can resume with zero prior context.
> Last updated: 2026-06-03

---

## Project overview

**What it is:** Python CLI tool that scans a Gmail inbox, classifies college recruitment
spam using tiered rules + Groq LLM, and archives (never deletes) the spam emails.

**Why it exists:** AP CS A final project. Presented live to a teacher — every line must
be explainable. Clarity over cleverness. No browser automation, no extensions, Python only.

**User:** Alex Du — da1.alexdu@gmail.com — first name "Alex"

---

## Files

```
sweep/
├── auth.py          OAuth → get_service(). Scope: gmail.modify.
├── classify.py      Tiered classifier → classify(email, my_name="Alex")
├── sweep.py         Main loop: fetch → classify → archive → log → stats
├── whitelist.txt    Senders that are never archived (one address per line)
├── seen_ids.txt     Gmail message IDs already processed and left in inbox
├── .env             GROQ_API_KEY=... (never commit)
├── credentials.json Google OAuth app credentials (never commit)
├── token.json       Cached OAuth token (never commit, delete to re-auth)
├── requirements.txt google-auth-oauthlib, google-api-python-client, python-dotenv,
│                    groq, tqdm, rich, requests
├── sweep_log.json   Appended JSON log of every run (created on first run)
├── README.md        Public-facing project README with Mermaid flowchart
├── STUDY_GUIDE.md   Full function-by-function reference in plain English
└── PROGRESS.md      This file
```

---

## Architecture

```
sweep.py: main loop
  │
  ├─ load_whitelist()            Read whitelist.txt → set of addresses
  ├─ load_seen_ids()             Read seen_ids.txt → set of Gmail message IDs
  ├─ auth.get_service()          OAuth, gmail.modify scope
  ├─ get_inbox_ids()             messages.list(labelIds=["INBOX"], maxResults=N)
  ├─ get_message()               messages.get(format="full") → decode headers + body
  │
  ├─ [per email]
  │    ├─ seen_ids check         skip before fetching if already processed
  │    ├─ is_whitelisted()       skip classification entirely
  │    └─ classify.classify()    ← the core logic, see below
  │         │
  │         ├─ Scope gate: is_college_related()?
  │         │    • Known spam sender domain                → in scope
  │         │    • "admissions"/"university"/"college"
  │         │      in sender string (display name + addr)  → in scope
  │         │    • .edu sender + EDU_ADMISSIONS_KEYWORDS   → in scope
  │         │    • .edu sender, no keywords                → Groq (not out_of_scope!)
  │         │    • non-.edu + COLLEGE_KEYWORDS             → in scope
  │         │    • else                                    → out_of_scope, done
  │         │
  │         ├─ Tier 1: is_definite_keep()
  │         │    Checks KEEP_PHRASES in subject+body. Returns "keep" at 100%.
  │         │    Runs BEFORE Tier 2 — a real acceptance from pitt.edu is safe.
  │         │
  │         ├─ Tier 2: is_definite_recruitment()
  │         │    spam_sender alone → True
  │         │    unsubscribe AND any_cta → True
  │         │    any_cta alone → True
  │         │    "apply now" only counts as cta when paired with college_context
  │         │      (college_context = "admissions" in sender OR "campus" in body)
  │         │
  │         └─ Tier 3: ask_groq()
  │              Called when scope gate passes but no rule fires,
  │              OR when .edu sender has no EDU_ADMISSIONS_KEYWORDS.
  │              Returns {"label": "recruitment"|"keep", "confidence": 0.0-1.0}
  │              confidence < 0.8 on recruitment → "skip_review" (never archived)
  │
  ├─ save_seen_ids()             Append non-recruitment IDs to seen_ids.txt
  └─ write sweep_log.json + print stats
```

**Archive = remove INBOX label only.**
`users.messages.modify(removeLabelIds=["INBOX"])` — email stays in All Mail,
fully recoverable. `messages.delete` is NEVER called anywhere.

**Default = dry run.** Pass `--archive` or `--confirm` for real changes.

---

## sweep.py flags

```bash
python sweep.py                            # preview only — shows what would happen, then exits (no prompt)
python sweep.py --max 20                   # same, limited to 20 messages (default: 100)
python sweep.py --debug                    # preview with per-email body snippet + reason
python sweep.py --confirm                  # RECOMMENDED: preview + prompts "Archive? [y/N]" at end
python sweep.py --archive                  # archives immediately, no preview or prompt
python sweep.py --archive --unsubscribe    # archive + attempt List-Unsubscribe
python sweep.py --confirm --unsubscribe    # preview → prompt → archive + unsubscribe
python sweep.py --archive --max 200        # large run, no prompt
```

---

## Logging (sweep_log.json)

Every run appends one entry to `sweep_log.json`. Structure:
```json
[
  {
    "timestamp": "2026-06-01T19:30:00",
    "mode": "dry_run | archive",
    "total_scanned": 20,
    "emails": [
      {
        "sender": "...",
        "subject": "...",
        "label": "recruitment|keep|out_of_scope|skip_review|whitelisted",
        "tier": "rule|groq|none",
        "confidence": 1.0,
        "reason": "rule: spam signal detected",
        "action_taken": "would_archive|archived|keep|out_of_scope|skip_review|whitelisted"
      }
    ]
  }
]
```
Body content is deliberately NOT logged.

---

## Phrase lists (exact current state)

### KEEP_PHRASES — Tier 1 (definite keep)
```python
"we received your application"   # already submitted, not a CTA
"your application has"           # "has been reviewed/received/accepted"
"congratulations"                # acceptances, awards
"your enrollment"                # post-acceptance
"admission decision"             # a decision is being communicated
"your admission"                 # "your admission to..."
"enrollment deposit"             # post-acceptance action
```

### RECRUITMENT_PHRASES — Tier 2 (definite spam)
```python
"students like you", "start your application", "visit our campus",
"campus tour", "tour our campus", "schedule a tour", "visit day",
"open house", "explore your future", "discover your potential",
"i encourage you to apply"
```
Plus "apply now" with college_context pairing.

### SPAM_SENDER_DOMAINS
```python
"emsihe.com", "marketo.com", "exacttarget.com", "salesforceemail.com", "pardot.com"
```

### EDU_ADMISSIONS_KEYWORDS — scope gate (.edu senders)
```python
"campus", "admissions", "admission", "enrollment", "undergraduate",
"class of", "open house", "visit day", "campus tour", "tour campus"
```

### COLLEGE_KEYWORDS — scope gate (non-.edu senders)
```python
"university", "college", "admissions", "admission", "campus",
"undergraduate", "enrollment", "applicant", "tuition", "degree",
"apply", "application", "academic", "scholarship", "major", "transfer",
"visit day", "campus tour", "tour campus", "information session",
"class of", "freshman", "first-year", "student life"
```

---

## Current status

**What works:**
- auth.py, classify.py, sweep.py all wired up and tested
- Dry run and --archive both work
- --confirm: dry run + prompt at end, no double-scan
- --debug: per-email body preview and classification reason
- Whitelist (whitelist.txt): seeded with elise@ultimateivyleagueguide.com, noreply@commonapp.org
- Seen-IDs cache (seen_ids.txt): skip already-processed emails on repeat runs
- Logging to sweep_log.json with per-email tier/confidence/action
- Stats table with explicit denominator ("X of Y in-scope")
- BGSU correctly caught (rule: spam signal detected)
- academia.edu correctly excluded
- Pitt/real acceptances correctly kept by Tier 1
- Groq non-JSON fallback uses tqdm.write (doesn't clobber progress bar)

**Known quirks (not bugs):**
- ~10-15% of out_of_scope emails pass the scope gate (Pacsun, Morning Brew, etc.)
  because COLLEGE_KEYWORDS contains broad words like "major", "academic". Groq
  correctly returns "keep" for all of them. No false archives, just extra API calls.
- Groq occasionally returns non-JSON — fallback always returns "keep" (safe).
- Gmail's blue "Unsubscribe" button stays visible after programmatic unsubscribe —
  it's Gmail UI rendered from the header, not a status indicator.

---

## TODO / Backlog

### Inbox sweep
```bash
# Dry run + confirm each batch, incrementing --max by ~1000
python sweep.py --max 1000 --confirm
python sweep.py --max 2000 --confirm   # skips ~750 already-seen, goes deeper
python sweep.py --max 3000 --confirm
```
Inbox has ~5k emails, ~25% estimated college spam.

### Demo prep checklist
- [ ] Can explain every function in auth.py, classify.py, sweep.py
- [ ] Can explain OAuth flow (credentials.json vs token.json)
- [ ] Can explain why archive ≠ delete (label removal, recoverable)
- [ ] Can explain tier logic: scope → keep → recruitment → Groq
- [ ] Can explain why .edu alone isn't enough (academia.edu example)
- [ ] Can explain Groq confidence threshold (< 0.8 → skip_review)
- [ ] Can explain seen_ids: only non-recruitment cached; archived emails disappear naturally
- [ ] Can run live demo: --confirm → review list → y → verify in Gmail All Mail

---

## Dead ends — do not repeat these

| Dead end | What happened | Fix |
|---|---|---|
| "your application" in KEEP_PHRASES | Matched inside "start your application" (spam) | "we received your application" + "your application has" |
| .edu alone = in scope | academia.edu has .edu but is commercial | Added EDU_ADMISSIONS_KEYWORDS requirement |
| EDU_ADMISSIONS_KEYWORDS too strict | Broke BGSU, UChicago, Earlham | Route .edu-no-keyword emails to Groq |
| "apply now" standalone | academia.edu "Apply now for Premium" → false archive | apply_now_counts = has_apply_now AND college_context |
| "open house" in non-.edu COLLEGE_KEYWORDS | Realtor.com → false archive | Removed from COLLEGE_KEYWORDS |
| campus-visit phrases only in scope gate | Tier 2 misses them → Groq unreliable | Added to RECRUITMENT_PHRASES too |
| Groq prompt "recruitment vs personal" | academia.edu archived at 90% | Rewrote prompt: "keep" = everything not mass-recruitment |

---

## OAuth notes

Scope: `gmail.modify` (read + label-modify + send). Cannot permanently delete.
- `credentials.json` = the app's identity (from Google Cloud Console)
- `token.json` = your cached login session (generated on first auth)
- If scope changes, delete `token.json` and re-run `python auth.py` to re-auth.
