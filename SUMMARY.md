# Postcard — Project Summary

> **Team:** Ethan (lead) + Yves  
> **Event:** PantherHacks 2026 (April 3–5, 2026)  
> **Track:** Cybersecurity  
> **Repository:** `postcard`  

---

## What It Does

**Postcard** is a web app that takes a screenshot of a social media post, traces it back to its original source URL, and produces a **Postmark Score (0–100%)** measuring how credible the screenshot is.

Tagline: *Trace every post back to its source.*

---

## The Problem

Screenshots strip all context. By the time something goes viral it's been cropped, captioned, and misattributed. A screenshot of a tweet looks nothing like the original tweet. A screenshot of a news article removes the byline, date, and corrections footer. Postcard reverses that entropy.

---

## How It Works

**User flow:** Upload screenshot → Pipeline runs → Postmark Score + subscore breakdown appears.

### Stage 1: Preprocessor
Image enhancement via `sharp` — contrast normalization, brightness adjustment, sharpening. Prepares the screenshot for reliable OCR.

### Stage 2: OCR + Postmark Extraction
AI SDK v6 `generateText` with `Output.object({ schema })` against **Gemini 2.0 Flash**. Multimodal image input. Extracts:
- Raw text (markdown)
- Postmark metadata: username handle, timestamp, platform, engagement counts, UI anchors

### Stage 3: Navigator Agent
AI SDK v6 `generateText` with `google.tools.googleSearch({})` against **Gemini 2.5 Flash**. Takes the postmark metadata and triangulates the exact source URL via 2–3 targeted Google searches.

### Stage 4: Forensic Auditor
Playwright scrapes the live URL. Computes three forensic subscores:
- **Origin Score (40%)** — Is the URL reachable and does it match the expected platform?
- **Temporal Score (30%)** — Does the timestamp in the screenshot match the live page?
- **Visual Score (30%)** — Do UI fingerprints (CSS, layout, logos) match the expected platform?

Final score: `TotalScore = 0.4·O + 0.3·T + 0.3·V`

---

## Postmark Score

The overall score is a weighted percentage:

```
WEIGHTS = {
  ORIGIN:         0.30,
  CORROBORATION:  0.25,
  BIAS:           0.25,
  TEMPORAL:       0.20,
};

Postmark (%) = (
  ORIGIN         × Origin
  + CORROBORATION × Corroboration
  + BIAS         × Bias
  + TEMPORAL     × Temporal
) × 100
```

Weights are arbitrary educated guesses — future work is to optimize via user feedback or labeled dataset.

### Subscores

| Subscore | Range | Method |
|----------|-------|--------|
| **Origin** | 0 or 1 | Binary: URL found (1) or not found (0) |
| **Corroboration** | 0.0–1.0 | LLM counts independent vetted sources, scales 1→n |
| **Bias** | 0.0–1.0 | LLM judge: semantic similarity (1 = identical, 0 = completely distorted) |
| **Temporal** | 0.0–1.0 | Timestamp match or reasonable proximity |

### Bias Score (LLM Judge)

The LLM acts as a forensic media analyst, comparing the screenshot text against the fetched source (or corroboration results if no URL). It assesses:
1. Caption changes — what text was added, removed, or altered?
2. Attribution drift — was the author credited correctly?
3. Framing shifts — was the editorial angle changed?
4. Context removal — was surrounding context stripped?

**Important:** Due to the probabilistic nature of LLMs, repeated runs will NOT produce identical scores but will be consistent within an acceptable range. This is expected.

### Vetted Source Allowlist (TLD-Permissive)

A source is "vetted" if it belongs to a recognized institutional or journalistic TLD:

| Category | TLDs |
|----------|------ |
| Government | `.gov`, `.mil` |
| Academic | `.edu`, `.ac.uk`, `.ac.*` (international) |
| NGOs / Nonprofits | `.org` |
| News / Journalism | reuters.com, apnews.com, nytimes.com, washingtonpost.com, bbc.com, theguardian.com, cnn.com, and 30+ more |

TLD-permissive logic means any domain ending in `.gov`, `.mil`, `.edu`, `.ac.*`, or `.org` is automatically vetted. No need to enumerate every subdomain.

---

## Architecture

```
Image Buffer
    │
    ▼
┌─────────────────────┐
│  1. Preprocessor     │  sharp — contrast, brightness, sharpen
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  2. OCR + Postmark  │  AI SDK v6 + Gemini 2.0 Flash + Zod schema
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  3. Navigator Agent │  AI SDK v6 + google_search tool + Gemini 2.5 Flash
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  4. Forensic Auditor │  Playwright — scrapes live page
└──────────┬──────────┘
           ▼
PostcardReport
```

---

## File Map

| File | Responsibility |
|------|----------------|
| `src/lib/postcard.ts` | Pipeline entry point + top-level schema |
| `src/lib/vision/processor.ts` | Image preprocessing (sharp) |
| `src/lib/vision/ocr.ts` | AI SDK v6 OCR + PostmarkSchema |
| `src/lib/agents/navigator.ts` | AI SDK v6 Navigator Agent + google_search |
| `src/lib/agents/verifier.ts` | Playwright Forensic Auditor + AuditResultSchema |

---

## Database Schema

5 tables, all children cascade-delete on parent removal:

- **analyses** — main resource (id, status, timestamps, error)
- **screenshots** — uploaded image + sha256 cache key (UNIQUE on sha256)
- **posts** — social post found (url, platform, author)
- **sources** — corroborating sources (is_vetted flag)
- **judgments** — LLM sub-scores (corroboration/bias/temporal)

---

## REST API

Follows Google AIP-121 Resource-Oriented Design and AIP-122 Standard Methods.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/analyses` | Upload image, start pipeline, return job ID |
| `GET` | `/api/analyses/{id}` | Poll result |

### Error Contracts

All errors follow AIP-193:
```
{
  "error": {
    "code": 400 | 404 | 500,
    "message": "Human-readable description",
    "details": []
  }
}
```

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (TypeScript) |
| Styling | Tailwind CSS |
| Hosting | Vercel |
| AI SDK | AI SDK v6 (`@ai-sdk/google`) |
| Model | Gemini 2.0 Flash (OCR), Gemini 2.5 Flash (Navigator) |
| Validation | Zod (runtime + schema) |
| ORM | Drizzle ORM |
| Database | SQLite (Turso/libSQL for local dev + prod parity) |
| Image Processing | sharp |
| Browser Automation | Playwright |
| API Style | REST, Google AIPs compliant |

---

## Constraints

- **Hackathon:** ~48 hours (April 3–5, 2026)
- **Web app only** — no mobile (Swift/Expo)
- **Functional end-to-end demo** judges can interact with
- Ship the core flow even if model calls are simple; polish the score reveal

---

## Out of Scope

- Tracing chains of "who got info from where" (hard to prove attribution)
- Wayback Machine historical lookups
- Opinion vs. factual disambiguation on Instagram
- Mobile app

---

## Key Decisions Resolved

| Decision | Resolution |
|----------|------------|
| Web vs. mobile | Web app only |
| Database | SQLite via Turso/libSQL |
| ORM | Drizzle ORM (type-safe, edge-native) |
| AI SDK | v6 with Zod structured output |
| Bias scoring | Automatic, probabilistic, LLM-judged |
| Corroboration | Scales 1→n, exponential |
| Vetted sources | TLD-permissive allowlist |
| Weights | Equal-ish educated guess, adjustable constants |
| Architecture | Server-side pipeline |
| Caching | SHA256 hash of image bytes → SQLite |
| Scoring | Postmark Score (%) with progressive disclosure |

---

## Open Questions (Future Work)

- [ ] Optimize weights via user feedback or labeled dataset
- [ ] Wayback Machine historical lookup
- [ ] Mobile app (Swift/Expo)
- [ ] Domain authority signals beyond allowlist
