# Postcard project summary

> **Team:** Ethan (lead) + Yves  
> **Event:** PantherHacks 2026 (April 3–5, 2026)  
> **Track:** Cybersecurity  
> **Repository:** `postcard`

## What it does

**Postcard** is a digital forensics tool that takes a social media post URL, traces it back to its original source, and produces a **Postcard Score (0–100%)** measuring how much the content has drifted from the primary truth.

Tagline: _Trace every post back to its source._

## The problem

Screenshots strip all context. By the time something goes viral it's been cropped, captioned, and misattributed. A screenshot of a tweet looks nothing like the original tweet. A screenshot of a news article removes the byline, date, and corrections footer. Postcard reverses that entropy by performing a multi-stage forensic audit of the primary source.

## How it works

**User flow:** Enter Post URL → Forensic Pipeline Runs → Postcard Score + Subscore Breakdown appears.

### Stage 1: preprocessor

Image enhancement via `sharp` — contrast normalization, brightness adjustment, sharpening. Prepares any forensic evidence (screenshots) for reliable OCR.

### Stage 2: OCR and postcard extraction

AI SDK v6 `generateText` with `Output.object({ schema })` against **Gemini 2.0 Flash**. Multimodal input. Extracts:

- Raw text (markdown)
- Forensic metadata: username handle, timestamp, platform, engagement counts, UI anchors

### Stage 3: navigator agent

AI SDK v6 `generateText` with `google.tools.googleSearch({})` against **Gemini 2.5 Flash**. Takes the extracted metadata and triangulates the exact source URL via targeted Google searches.

### Stage 4: forensic auditor

Playwright scrapes the live URL. Computes four forensic subscores:

- **Origin Score (30%)** — Is the URL reachable and does it match the expected platform?
- **Corroboration Score (25%)** — Does the content match vetted institutional or journalistic sources?
- **Bias Score (25%)** — Has the semantic meaning shifted or been distorted?
- **Temporal Score (20%)** — Do timestamps and engagement rates align with the live page?

## Postcard score

The overall score is a weighted percentage:

```
WEIGHTS = {
  ORIGIN:         0.30,
  CORROBORATION:  0.25,
  BIAS:           0.25,
  TEMPORAL:       0.20,
};

Postcard (%) = (
  ORIGIN         × Origin
  + CORROBORATION × Corroboration
  + BIAS         × Bias
  + TEMPORAL     × Temporal
) × 100
```

### Bias score (LLM judge)

The LLM acts as a forensic media analyst, comparing the screenshot or URL text against the fetched source. It assesses:

1. Caption changes — what text was added, removed, or altered?
2. Attribution drift — was the author credited correctly?
3. Framing shifts — was the editorial angle changed?
4. Context removal — was surrounding context stripped?

## Architecture

```
Post URL / Image
    │
    ▼
┌─────────────────────┐
│  1. Preprocessor     │  sharp — contrast, brightness, sharpen
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  2. OCR + extraction │  AI SDK v6 + Gemini 2.0 Flash + Zod schema
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

## Tech stack

| Layer      | Choice                                               |
| ---------- | ---------------------------------------------------- |
| Framework  | Next.js 16 (TypeScript)                              |
| Styling    | Vanilla CSS (Premium Aesthetics)                     |
| Hosting    | Vercel                                               |
| AI SDK     | Vercel AI SDK v6 (`@ai-sdk/google`)                  |
| Model      | Gemini 2.0 Flash (OCR), Gemini 2.5 Flash (Navigator) |
| Database   | SQLite (libSQL for Turso)                            |
| Automation | Playwright + sharp                                   |

## Key decisions

- **Postcard Noun:** Unified all terminology to "Postcard" (the tool) and "Postcard Score" (the result).
- **JSON SSE:** Used JSON body for `POST /api/postcards` to simplify the OpenAPI spec.
- **Weights:** Implemented a refined 4-part forensic model (30/25/25/20).
- **Vetted Sources:** Implemented TLD-permissive logic (`.gov`, `.edu`, `.org`).
