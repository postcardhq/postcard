# Postcard — Design Document

> **Team:** Ethan (lead) + Yves  
> **Event:** PantherHacks 2026 (April 3–5, 2026)  
> **Track:** Cybersecurity  
> **Repository:** `postcard`  
> **Stack:** Web app — server-side pipeline (see Section 14)

---

## TL;DR — What We're Building

A web app that takes a screenshot of a social media post, finds the original post URL, and scores how credible it is based on:
- **Origin** — Can we locate the original post?
- **Corroboration** — Do independent sources agree?
- **Bias** — Is the screenshot's framing different from the source?
- **Temporal** — Does the timestamp check out?

The output is a **Postmark Score (0–100%)** with subscore breakdown available via progressive disclosure.

---

## 1. Concept & Vision

**Tagline:** *Trace every post back to its source.*

**Core problem:** Screenshots strip all context. By the time something goes viral it's been cropped, captioned, and misattributed. Postcard reverses that entropy by finding the original post URL and scoring how trustworthy the screenshot is.

**Workflow:** User uploads screenshot → Postcard locates the original post → fetches full metadata → compares against screenshot → outputs Postmark Score + subscore breakdown.

**Out of scope for now:**
- Tracing chains of "who got info from where" (too hard — hard to prove attribution)
- Wayback Machine historical lookups (future work)
- Degrees of separation metaphor (misleading — we trace events directly, not chains)

---

## 2. Hackathon Constraints

- **Timebox:** ~48 hours (April 3–5)
- **Team size:** 2–4 people
- **Goal:** Functional end-to-end demo judges can interact with
- **Scope:** Web app only. No mobile (Swift/Expo).
- **Strategy:** Ship the core flow — upload → locate post → score — even if the underlying model calls are simple. Polish the score reveal and progressive disclosure.

---

## 3. The Postcard Pipeline

### Step 1: Post Locator (Gemini 3+ Multimodal)

The first and most critical step. Given a screenshot, Gemini 3+ extracts the **original post URL** directly from the social platform.

This is crucial because:
- Screenshot text may be cropped (full description not visible)
- Metadata (likes, shares, exact timestamp) may not appear in screenshot
- We want the full, unmodified source to compare against

**Input:** Screenshot image  
**Output:** Original post URL (or null if not found)

### Step 2: URL Verification

If a URL is found, fetch it directly to extract:
- Full post text (compare against screenshot)
- Exact timestamp
- Author/handle
- Engagement counts
- Any edit history

### Step 3: Corroboration Search (if URL not found or supplementary)

If the post cannot be located via direct URL, fall back to Google/Gemini web search:
- Generate targeted search queries from screenshot content
- Find independent sources reporting the same claim/event
- Score corroboration based on number of independent vetted sources

### Step 4: Bias Assessment (LLM Judge)

LLM acts as a judge, comparing screenshot against the fetched source (or search results if no URL):
- Caption changes?
- Attribution drift?
- Framing shifts?
- Context removed?

Outputs a **Bias Subscore (0–100)**.

### Step 5: Postmark Score (Overall)

Combine all subscores into a weighted **Postmark Score (0–100%)**.

---

## 4. Postmark Score — Components & Weights

### Score Constants (easily adjustable)

```javascript
const WEIGHTS = {
  ORIGIN:         0.30,  // Can we locate the original post?
  CORROBORATION:  0.25,  // Do independent sources corroborate?
  BIAS:           0.25,  // Is the screenshot faithful to the source?
  TEMPORAL:       0.20,  // Does the timestamp check out?
};
```

> **Future work:** Optimize weights via user feedback or labeled dataset. For now, educated guesses illustrate the concept. Weights are arbitrary but dynamic — change the constants to rebalance.

### Subscores

| Subscore | Range | Method |
|----------|-------|--------|
| **Origin** | 0 or 1 | Binary: URL found (1) or not found (0) |
| **Corroboration** | 0.0–1.0 | LLM counts independent vetted sources, scales 1→n |
| **Bias** | 0.0–1.0 | LLM judge: semantic similarity (1 = identical, 0 = completely different) |
| **Temporal** | 0.0–1.0 | Timestamp match or reasonable proximity |

### Overall Postmark Score

```
Postmark (%) = (
  WEIGHTS.ORIGIN        × Origin
  + WEIGHTS.CORROBORATION × Corroboration
  + WEIGHTS.BIAS          × Bias
  + WEIGHTS.TEMPORAL      × Temporal
) × 100
```

### UI: Progressive Disclosure

- **Top level:** Postmark Score as a single percentage (e.g., "73%")
- **Expandable:** Subscore breakdown (Origin: ✓, Corroboration: 2/3 sources, Bias: minor framing shift, Temporal: 3hrs off)
- **Further:** Full LLM narrative explanation

---

## 5. Vetted Source Allowlist (TLD-Permissive)

A source is "vetted" if it belongs to a recognized institutional or journalistic TLD:

| Category | TLDs |
|----------|------|
| Government | `.gov`, `.mil` |
| Academic | `.edu`, `.ac.uk`, `.ac.*` (international) |
| NGOs / Nonprofits | `.org` |
| News / Journalism | See below |

**News domains (initial allowlist):**
```
reuters.com, apnews.com, ap.co, nytimes.com, washingtonpost.com,
wsj.com, theguardian.com, bbc.com, bbc.co.uk, cnn.com, foxnews.com,
nbcnews.com, abcnews.com, abc.net.au, cbsnews.com, pbs.org,
npr.org, usatoday.com, latimes.com, politico.com, axios.com,
huffpost.com, theatlantic.com, wired.com, arstechnica.com,
techcrunch.com, theverge.com, independent.co.uk, dailymail.co.uk,
mirror.co.uk, express.co.uk, sky.com, newsweek.com, time.com,
forbes.com, bloomberg.com, reutersagency.com
```

**TLD-permissive logic:** Any domain ending in `.gov`, `.mil`, `.edu`, `.ac.*`, or `.org` is automatically vetted. No need to enumerate every subdomain.

---

## 6. Bias Score — LLM as Judge

**Method:** LLM compares screenshot text against fetched source (or corroboration results).

**Prompt (simplified):**
```
You are a forensic media analyst. Compare the original text (A) against the screenshot text (B).

Assess:
1. Caption changes — what text was added, removed, or altered?
2. Attribution drift — was the author credited correctly?
3. Framing shifts — was the editorial angle changed?
4. Context removal — was surrounding context stripped?

Output a score 0–100 where 100 = identical framing, 0 = completely distorted.
Also output a short narrative explanation of what changed.
```

**Important:** Due to the probabilistic nature of LLMs, repeated runs will NOT produce identical scores but will be **consistent within an acceptable range**. This is expected.

---

## 7. Caching (SQLite)

**Cache key:** MD5 hash of uploaded image bytes  
**Cache value:** Full analysis result (Postmark Score, all subscores, URL found, narrative)

**Flow:**
1. User uploads image
2. Compute MD5 hash
3. Check SQLite for existing result → instant response if hit
4. If miss → run pipeline → store result → return

---

## 8. UI / UX

- **Mobile-first responsive** — follows best practices, no bloat
- **Dark mode** — `prefers-color-scheme` media query (no toggle needed)
- **Minimal** — Black/dark background
- **Core interaction:**
  1. Drag-and-drop or tap to upload
  2. Submit → loading state
  3. Result: Postmark Score (%) + expand for subscore breakdown

---

## 9. Navigator Agent — System Prompt

```
You are the Postcard Navigator Agent. Given OCR output from a social media screenshot, find the original source URL.

INPUT:
- Extracted text (caption, comment, post body)
- Platform clues (Instagram UI, X/Twitter blue check, YouTube thumbnail style, Reddit upvote icon, etc.)
- Any @handles, timestamps, engagement counts

TASK:
1. Identify the most search-dense phrase (the "hook")
2. Combine with platform context to generate 2–3 targeted queries
3. Prioritize exact-match searches with quotes and site: operators
4. Return candidate source URLs ranked by confidence

OUTPUT:
{
  "candidates": [
    { "url": "...", "query": "...", "confidence": 0.9 }
  ]
}

CONSTRAINTS:
- Maximum 3 search queries
- Prefer primary sources over aggregators
- Bias toward recent content (last 90 days) unless OCR shows older timestamp
```

---

## 10. Feature Priority

### Must Ship (MVP)
- [ ] Image upload form (drag-and-drop)
- [ ] Step 1: Post Locator (Gemini 3+ multimodal → post URL)
- [ ] Step 2: URL fetch + metadata extraction
- [ ] Step 3: Corroboration search (Gemini Google Search tool)
- [ ] Step 4: Bias assessment (LLM judge)
- [ ] Step 5: Postmark Score + progressive disclosure
- [ ] SQLite caching
- [ ] Deployed live URL (Vercel)

### Future Work
- [ ] Wayback Machine historical lookup
- [ ] Weight optimization (labeled dataset or user feedback)
- [ ] Mobile app (Swift/Expo)
- [ ] Opinion vs. factual disambiguation

---

## 11. Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | Next.js or vanilla HTML/JS + Tailwind | Speed to MVP |
| Vision / URL extraction | Gemini 3+ (multimodal image input) | Native multimodal; finds post URL directly |
| Search | Gemini `googleSearch` tool | Built into Gemini; no extra API keys |
| Bias scoring | Gemini (LLM judge) | Prompt-based; no extra model needed |
| Persistence | SQLite | Server-side caching and storage |
| Hosting | Vercel (free SSR) | Fastest path to live URL |

**Key API:** `generativeLanguage.googleapis.com` — configure in [Settings > Advanced](/?t=settings&s=advanced) as `GEMINI_API_KEY`.

---

*Last updated: 2026-04-03 21:05 UTC*
