# Sweep — Study Guide & Reference Manual

A Gmail inbox cleaner for college recruitment spam.
This document explains every function in plain English alongside the code,
shows how the system fits together, and doubles as a demo reference.

---

## How to run it

**Normal workflow (recommended):**
```bash
python sweep.py --max 50 --confirm
```
Scans 50 emails, shows you the full list of what *would* be archived, then pauses
and asks **"Archive these N emails? [y/N]"** — type `y` to commit or `n` to do nothing.
One scan, one decision, no re-running.

**Just want to preview without committing:**
```bash
python sweep.py --max 50
```
Shows the same preview but exits immediately — no prompt, no changes.
Run this when you just want to see what's in the inbox without deciding yet.

**Already reviewed and ready to go:**
```bash
python sweep.py --max 50 --archive
```
Archives immediately with no prompt. Use this when you've already previewed
and are confident, or when scripting.

---

## Quick command reference

| Command | What it does |
|---|---|
| `python sweep.py` | Preview only — shows what *would* be archived, then exits. No prompt. |
| `python sweep.py --max 50` | Same, limited to the 50 most recent inbox emails |
| `python sweep.py --confirm` | Preview + **prompts "Archive? [y/N]"** at the end — the normal workflow |
| `python sweep.py --archive` | Archives immediately, no preview or prompt |
| `python sweep.py --debug` | Preview with per-email body snippet — use to diagnose misses |
| `python sweep.py --archive --unsubscribe` | Archive + send programmatic unsubscribe requests |
| `python sweep.py --confirm --unsubscribe` | Preview → prompt → archive + unsubscribe |
| `python auth.py` | Test OAuth alone, prints your Gmail address |

---

## System block diagram

Components and how they connect:

```
┌──────────────────────────────────────────────────────────────────────┐
│                           Your Computer                              │
│                                                                      │
│   sweep.py ─────────────── auth.py ──────────────── Google OAuth    │
│       │                                                    │         │
│       │                                              Gmail API       │
│       │                                                    │         │
│       │   whitelist.txt   (never archive these senders)   │         │
│       │   seen_ids.txt    (skip already-processed IDs)     │         │
│       │   sweep_log.json  (history of every run)           │         │
│       │                                                              │
│       └────────── classify.py ────────────────── Groq API           │
│                        │              (Llama 3.1 8B, free)           │
│                        │                                             │
│                   KEEP_PHRASES                                       │
│                   RECRUITMENT_PHRASES                                │
│                   SPAM_SENDER_DOMAINS                                │
│                   COLLEGE_KEYWORDS                                   │
│                   EDU_ADMISSIONS_KEYWORDS                            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## How one email flows through the system

```
python sweep.py --max 50 --confirm
        │
        ├─ load_whitelist()    read whitelist.txt → set of addresses
        ├─ load_seen_ids()     read seen_ids.txt  → set of Gmail IDs
        ├─ get_service()       OAuth handshake, get Gmail API handle
        │
        ▼
  get_inbox_ids()   ←── Gmail: fetch 50 newest message IDs from inbox
        │
        ▼ ──────────── loop: for each message ID ────────────────────┐
        │                                                             │
   ID in seen_ids? ──YES──► counts["already_seen"]++, skip          │
        │ NO                                                          │
        ▼                                                             │
   get_message()   ←── Gmail: fetch full email (headers + body)     │
   decode_body()       base64 → plain text                           │
        │                                                             │
   is_whitelisted()? ──YES──► label="whitelisted", cache ID, skip   │
        │ NO                                                          │
        ▼                                                             │
   ┌────────────── classify() ──────────────────────────────────┐    │
   │                                                             │    │
   │  is_college_related()? ──NO──► "out_of_scope", cache ID   │    │
   │          │ YES                                              │    │
   │          ▼                                                  │    │
   │  is_definite_keep()? ──YES──► "keep", cache ID            │    │
   │          │ NO                                               │    │
   │          ▼                                                  │    │
   │  is_definite_recruitment()? ──YES──► "recruitment"         │    │
   │          │ NO                                               │    │
   │          ▼                                                  │    │
   │  ask_groq()  ──► "keep" (cache ID)                        │    │
   │                   "recruitment"                             │    │
   │                   "skip_review" (cache ID)                 │    │
   └─────────────────────────────────────────────────────────────┘    │
        │                                                             │
   label == "recruitment"?                                            │
     if --archive:  archive_message()   ← remove INBOX label        │
     if --unsub:    try_unsubscribe()                                 │
   label != "recruitment": new_seen_ids.add(email["id"])             │
        │                                                             │
        └─────────────────────────── next email ─────────────────────┘
        │
        ▼
   save_seen_ids()     append new IDs to seen_ids.txt
        │
        ▼
   print Results table + would-archive list
        │
        ▼ (if --confirm)
   "Archive these N emails? [y/N]"
     YES → archive_message() for each, update log entries
        │
        ▼
   write sweep_log.json
   print Decision Stats table
```

---

## File map

| File | What it is |
|---|---|
| `auth.py` | Handles Google login. One function: `get_service()`. |
| `classify.py` | The brain. Given one email, decides keep / archive / ask Groq. |
| `sweep.py` | The body. Fetches emails, calls classify, archives, logs, prints stats. |
| `whitelist.txt` | You edit this. One email address per line. Those senders are never archived. |
| `seen_ids.txt` | Auto-managed. Gmail message IDs that were already processed and kept. |
| `sweep_log.json` | Auto-managed. JSON history of every run. |
| `.env` | Your Groq API key. Never committed to git. |
| `credentials.json` | Your Google Cloud app credentials. Never committed. |
| `token.json` | Your saved Gmail login session. Never committed. Delete to force re-login. |

---

## auth.py

### `get_service()`

**Plain English:** "Log me into Gmail and give me a handle I can use to make API calls."

The first time this runs, it opens a browser tab and asks you to approve access.
After that it saves a file called `token.json` so every future run is silent.
If the saved token expires, it silently refreshes it — no browser needed.

```
credentials.json    ←  your app's identity (from Google Cloud Console)
token.json          ←  your personal login session (created on first run)

get_service():
  1. Does token.json exist?
       YES → load it
  2. Is the token still valid?
       NO, but has a refresh token → silently get a new one from Google
       NO, no refresh token       → open browser for full login
  3. Save the (possibly new) token back to token.json
  4. Return a "service" object — a Python handle for the Gmail API
```

**Why `gmail.modify` scope?**
There are three Gmail scopes. `readonly` = read only. `modify` = read + change labels
+ send mail. `full` = everything including permanent delete. We use `modify` because
archiving requires changing labels and unsubscribing via mailto requires sending mail.
`modify` cannot permanently delete — that requires a separate delete scope we don't have.

---

## sweep.py

### `get_inbox_ids(service, max_results)`

**Plain English:** "Ask Gmail for a list of message IDs currently in the inbox."

Returns a list like `[{"id": "abc123", "threadId": "xyz"}, ...]`.
We only get IDs here — fetching full content for 1000 emails at once would be
enormous. Instead we get the ID list first, then fetch each one individually.

```python
service.users().messages().list(
    userId="me",
    labelIds=["INBOX"],   # only inbox, not All Mail or Sent
    maxResults=max_results,
)
```

---

### `decode_body(payload)`

**Plain English:** "Pull the readable text out of a Gmail message, no matter how
it's packaged."

Gmail stores email bodies in a nested structure. An email can be:
- **Simple** (`text/plain`): one block of text, base64-encoded
- **Multipart** (`multipart/alternative`): plain text + HTML versions of the same email
- **HTML only** (`text/html`): no plain text, just HTML tags

The function handles all three:

```
MIME type?
  text/plain  → base64-decode → return as string
  multipart   → first look for a text/plain part inside
                if none, recurse into all parts
  text/html   → base64-decode → strip all <tags> → return plain text
  other       → return ""
```

**Why base64?** Email was designed for ASCII text. Binary data (including UTF-8)
gets encoded as base64 for safe transport. Gmail stores it that way in its API.
`base64.urlsafe_b64decode(data).decode("utf-8")` reverses it.

---

### `parse_headers(header_list)`

**Plain English:** "Convert Gmail's awkward header format into a normal dictionary."

Gmail gives you headers as `[{"name": "From", "value": "..."}, ...]`.
This turns it into `{"From": "...", "Subject": "...", ...}` so you can do
`headers["From"]` instead of searching a list every time.

---

### `get_message(service, msg_id)`

**Plain English:** "Fetch one complete email and return it as a clean dictionary."

```
Gmail API call: messages.get(id=msg_id, format="full")
       ↓
   raw JSON blob
       ↓
   extract payload → decode headers → decode body
       ↓
   return {
     "id":      the Gmail message ID
     "sender":  From header, e.g. "BGSU Visit Team <choosebgsu@bgsu.edu>"
     "subject": Subject header
     "snippet": Gmail's own 100-char plain-text preview (always populated)
     "body":    decoded full body text
     "headers": full header dict (needed by try_unsubscribe)
   }
```

---

### `load_seen_ids()` / `save_seen_ids(new_ids)`

**Plain English:** "Remember which emails we've already decided to leave in the inbox,
so we don't waste time re-processing them next run."

- `load_seen_ids()` reads `seen_ids.txt`, returns a Python set of ID strings
- `save_seen_ids(new_ids)` appends new IDs to `seen_ids.txt`, one per line

**What gets added to seen_ids:** any email labeled keep, out_of_scope, skip_review,
or whitelisted. These are emails that stay in the inbox — we've decided about them,
no need to re-classify.

**What does NOT get added:** recruitment emails. They're removed from the inbox when
archived, so they'll never appear in a future scan anyway. Not tracking them also
means: if you manually move an archived email back to inbox, it will be re-scanned
and re-classified correctly.

---

### `load_whitelist(path)` / `is_whitelisted(email, whitelist)`

**Plain English:** "Some senders should never be archived no matter what. Check for them first."

`load_whitelist()` reads `whitelist.txt`. Lines starting with `#` are comments.
Returns a set of lowercase email addresses.

`is_whitelisted()` checks if any whitelisted address appears inside the sender field.
It uses substring matching so `"Elise <elise@ultimateivyleagueguide.com>"` correctly
matches the whitelisted address `"elise@ultimateivyleagueguide.com"`.

---

### `get_unsubscribe_targets(headers)`

**Plain English:** "Find the unsubscribe address/URL that the sender included in the email headers."

The `List-Unsubscribe` header is a standard field commercial bulk senders are required
to include. It looks like:

```
List-Unsubscribe: <mailto:unsub@college.com?subject=unsub>, <https://college.com/unsub?id=123>
```

This function extracts the mailto address and/or the HTTP URL using regex, returning
`(mailto_address_or_None, http_url_or_None)`.

---

### `try_unsubscribe(service, email)`

**Plain English:** "Try to unsubscribe from this sender without clicking anything manually."

Tries three methods in order, stops at the first that works:

```
Method 1 — RFC 8058 one-click POST (preferred, modern standard)
  If the email has a List-Unsubscribe-Post header:
  POST "List-Unsubscribe=One-Click" to the HTTP URL
  → Most major senders support this; it's what Gmail's own button uses

Method 2 — mailto (old but common)
  Send an empty email to the unsubscribe address via Gmail API
  → The subject line is the signal, not the body

Method 3 — HTTP GET (last resort)
  Visit the unsubscribe URL with a GET request
  → Works for simple one-click links; fails if the page needs a button click
```

Returns a string describing what happened, printed to the terminal.

**Note:** Gmail's blue "Unsubscribe" button will still appear on the email after this
runs — that button is rendered from the `List-Unsubscribe` header in the email itself,
not a live indicator of subscription status. It will always be there.

---

### `archive_message(service, msg_id)`

**Plain English:** "Remove this email from the inbox. It stays in All Mail — this is NOT deletion."

```python
service.users().messages().modify(
    userId="me",
    id=msg_id,
    body={"removeLabelIds": ["INBOX"]},
)
```

Gmail's architecture: every email has labels. "INBOX" is just one of them.
Removing it is exactly what Gmail's own Archive button does.
The email still lives in All Mail, is fully searchable, and can be moved back
to inbox at any time. `messages.delete` is never called anywhere in this codebase.

---

### `determine_tier(reason)`

**Plain English:** "Look at the reason string and decide whether a rule or the LLM made this decision."

Used for the stats table. Returns `"rule"` or `"groq"`.

```python
"rule:"       → tier = "rule"   (Tier 1 or Tier 2 fired)
"no college"  → tier = "rule"   (scope gate rejected it)
anything else → tier = "groq"   (Tier 3 / ask_groq was called)
```

---

### `main()`

**Plain English:** "The conductor. Reads flags, calls every other function in the right order,
prints the results."

Execution order:
1. Parse flags (`--archive`, `--max`, `--debug`, `--confirm`, `--unsubscribe`)
2. Load whitelist + seen_ids cache
3. Authenticate (`get_service()`)
4. Fetch message ID list (`get_inbox_ids()`)
5. For each message ID:
   - Skip if in seen_ids (no API call)
   - Fetch full email (`get_message()`)
   - Skip if whitelisted
   - Classify (`classify()`)
   - If recruitment + `--archive`: archive it
   - Otherwise: add to seen_ids
6. Save new seen_ids
7. Print results table + would-archive list
8. If `--confirm`: prompt user, archive on "y"
9. Write `sweep_log.json`
10. Print Decision Stats table

---

## classify.py

### `is_college_related(email)` — the scope gate

**Plain English:** "Is this email even about college? If not, don't touch it."

This is the first filter. It runs before any archiving logic. If it returns False,
the email gets label `out_of_scope` and is never archived, period.

```
Check 1: Is the sender domain a known marketing platform?
         (emsihe.com, marketo.com, etc.)
         → YES: in scope (these only send college mail)

Check 2: Does the sender address/name contain "admissions", "university", or "college"?
         → YES: in scope

Check 3: Is the sender a .edu domain?
         → YES: check EDU_ADMISSIONS_KEYWORDS in subject + body
           Found: in scope
           Not found: route to Groq anyway (could be short/vague legit school email)

Check 4: Non-.edu sender
         → Check COLLEGE_KEYWORDS in subject + body
           Found: in scope
           Not found: out_of_scope, done
```

**Why separate .edu and non-.edu rules?**
Academia.edu is a `.edu` domain but it's a commercial paper platform, not a school.
Its emails say "Apply now for Premium" — the word "apply" is why we can't use
COLLEGE_KEYWORDS for .edu senders. EDU_ADMISSIONS_KEYWORDS is stricter and excludes
"apply" and "application" for exactly this reason.

---

### `is_definite_keep(email)` — Tier 1

**Plain English:** "Does this email contain phrases that only appear AFTER you've already applied?
If so, keep it no matter what."

Checks `KEEP_PHRASES` in `subject + body` (lowercased). Returns True immediately if
any phrase matches. This runs BEFORE the recruitment check — safety first.

```
KEEP_PHRASES catches:
  "we received your application"   → application already submitted
  "your application has"           → status update (reviewed, received, accepted)
  "congratulations"                → acceptance letter
  "your enrollment"                → post-acceptance follow-up
  "admission decision"             → a decision is being communicated
  "your admission"                 → "your admission to..."
  "enrollment deposit"             → "please pay your deposit"
```

**Why these specific phrases?**
Each phrase only appears *after* you've already applied. Recruitment spam (trying to
get you to apply) never uses them. This makes them safe, high-confidence keep signals.

---

### `is_definite_recruitment(email)` — Tier 2

**Plain English:** "Does this email have obvious spam signals? If so, mark it for archiving."

```
Signal 1: Spam sender domain alone
  emsihe.com, marketo.com, etc. → True immediately
  (These platforms only exist to send college recruitment blasts)

Signal 2: Unsubscribe link + any CTA
  CAN-SPAM law requires unsubscribe links on all commercial bulk email.
  Real personal emails from admissions officers never have one.
  Pair it with a CTA and you have very high confidence it's bulk mail.

Signal 3: Strong CTA alone
  "visit our campus", "campus tour", "students like you", etc.
  These phrases are specific enough to recruitment that they count alone.

Special case: "apply now"
  Common in recruitment spam BUT also in academia.edu premium upsells.
  Only counts when paired with: "admissions" in sender OR "campus" in body.
  Academia.edu sender is "message@academia.edu" — no "admissions".
  Academia.edu upsell body says "unlimited access to papers" — no "campus".
  So it never gets a false positive.
```

---

### `ask_groq(email, my_name)` — Tier 3

**Plain English:** "When the rules can't decide, ask an AI."

Called when either:
- The email passed the scope gate but no rule fired (truly ambiguous)
- The sender is a `.edu` domain but has no admissions keywords (could be legit school
  with a short email, or could be academia.edu)

Sends the sender, subject, and first 400 chars of body to Groq (Llama 3.1 8B, free).
The prompt asks for a JSON response: `{"label": "recruitment"|"keep", "confidence": 0.0-1.0}`

```
confidence >= 0.8 AND label="recruitment" → "recruitment" (will be archived)
confidence  < 0.8 AND label="recruitment" → "skip_review" (flagged but NOT archived)
label = "keep"                            → "keep"
Groq returns invalid JSON                 → "keep" (safe fallback, prints [warn])
```

**Why temperature=0?** We want consistent, deterministic answers every time.
Creativity is the enemy here.

**Why max_tokens=50?** We only need a tiny JSON blob. Fewer tokens = faster + cheaper.

**Why 400 chars of body?** Enough for the LLM to detect tone and signals.
Sending the whole email would waste tokens and slow things down.

---

### `classify(email, my_name)` — the top-level function

**Plain English:** "Run all three tiers in order. Return the final verdict."

```python
classify(email) → {
  "label":      "keep" | "recruitment" | "out_of_scope" | "skip_review" | "whitelisted",
  "reason":     human-readable explanation,
  "confidence": 0.0 to 1.0
}
```

Decision tree:
```
is_college_related()?
  NO + non-.edu → out_of_scope (reason: "no college signals")
  NO + .edu     → ask_groq() anyway (could be short legit school email)
  YES ↓
is_definite_keep()?
  YES → keep, confidence=1.0 (reason: "rule: keep phrase detected")
  NO  ↓
is_definite_recruitment()?
  YES → recruitment, confidence=1.0 (reason: "rule: spam signal detected")
  NO  ↓
ask_groq()
  → "recruitment" + conf >= 0.8 → recruitment  (reason: "LLM: 92% confident")
  → "recruitment" + conf < 0.8  → skip_review  (reason: "LLM: recruitment but only 71% confident")
  → "keep"                       → keep         (reason: "LLM: 95% confident")
```

---

## Phrase lists at a glance

| List | Used in | Purpose |
|---|---|---|
| `KEEP_PHRASES` | Tier 1 | Phrases that only appear post-application → always keep |
| `RECRUITMENT_PHRASES` | Tier 2 | Strong recruitment CTAs → archive (after scope gate) |
| `SPAM_SENDER_DOMAINS` | Tier 2 + scope gate | Marketing platforms that only send college blasts |
| `EDU_ADMISSIONS_KEYWORDS` | Scope gate | Admissions-specific words for .edu senders (excludes "apply") |
| `COLLEGE_KEYWORDS` | Scope gate | Broader college words for non-.edu senders |

---

## Key design decisions (the why behind the rules)

1. **Archive ≠ delete.** `removeLabelIds: ["INBOX"]` is Gmail's own Archive button.
   Email stays in All Mail, fully recoverable. `messages.delete` is never called.

2. **Default is always dry run.** You have to explicitly pass `--archive` or `--confirm`.
   It's impossible to accidentally archive anything by just running `python sweep.py`.

3. **Tier 1 (keep) runs before Tier 2 (archive).** A real acceptance from pitt.edu
   might contain "campus" or "application." Keep check must win.

4. **academia.edu is the main false-positive risk.** It's a `.edu` domain. Its emails
   say "apply now." It has unsubscribe links. Three separate rules exist specifically
   to prevent it from being archived: EDU_ADMISSIONS_KEYWORDS excludes "apply,"
   apply_now requires college_context, and the Groq prompt explicitly names it.

5. **Groq confidence < 0.8 → skip_review, not archive.** The LLM isn't wrong often,
   but when it's uncertain, erring on the side of keeping is safer than accidentally
   archiving something real.

6. **Seen IDs only tracks non-recruitment.** Archived emails leave the inbox naturally.
   Only kept emails need caching. Manually un-archiving an email correctly triggers
   re-classification because its ID was never saved.

---

## Demo script (live walkthrough)

```bash
# 1. Show it's safe by default
python sweep.py --max 20

# 2. Show debug output for one email
python sweep.py --max 20 --debug 2>&1 | head -40

# 3. Show the confirm flow (single scan, no double-run)
python sweep.py --max 20 --confirm
# → walk through the would-archive list → type 'y'

# 4. Verify in Gmail
# Open Gmail → All Mail → confirm archived emails are there
# Try moving one back to inbox to show it's recoverable

# 5. Show the log
python -c "import json; [print(r['timestamp'], r['mode'], r['total_scanned']) for r in json.load(open('sweep_log.json'))]"
```

**Talking points for each step:**
- Step 1: "By default it never changes anything. You have to explicitly say --confirm or --archive."
- Step 3: "The classifier has three tiers — it tries cheap rules first and only calls the AI when rules can't decide."
- Step 4: "Archive means removing the INBOX label. The email is still in All Mail. Gmail's own Archive button does exactly the same thing."
- Step 5: "Every run is logged with what it decided and why, but never the body — privacy."
