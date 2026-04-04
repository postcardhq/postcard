# Postcard

> *Trace every post back to its source.*

Postcard is a digital forensics tool that takes a screenshot of a social media post and traces it to its origin — calculating how much the content has drifted from the original along the way.

**Track:** PantherHacks 2026 — Cybersecurity  
**Team:** Ethan + Yves  
**Stack:** Next.js · Gemini (Google AI) · Toolhouse · LangGraph

---

## What It Does

1. **Upload** a screenshot of any social media post
2. **Vision parse** — Gemini extracts text, handles, timestamps, engagement counts
3. **Navigator agent** — synthesizes high-precision search queries to find the primary source
4. **Forensic verifier** — checks source URL, timestamp consistency, visual fingerprints
5. **Postmark Score** + **Travel Log** — the verdict and the content's full path

---

## Postmark Score

```
S = (w₁ · Origin) + (w₂ · Temporal) + (w₃ · Visual)
```

| Score | Label | Meaning |
|-------|-------|---------|
| 0.9+ | ✅ Verified Origin | Primary source confirmed |
| 0.5–0.9 | ⚠️ Unreliable Postmark | Modified, parodied, or detunneled |
| < 0.5 | 🔴 Fabricated | Fabricated or heavily manipulated |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Postcard                             │
│                                                           │
│  Upload ──► Vision Parse ──► Navigator ──► Verdict        │
│   (UI)     (Gemini)        (Agent)        (Score + Log)  │
└──────────────────────────────────────────────────────────┘
```

### Component A — Vision Parser
- Model: Gemini 2.0 Flash (with Google Search grounding)
- Extracts: text, @handles, timestamps, view/like counts

### Component B — Navigator Agent
- Model: GPT-4o or Claude 3.5 Sonnet
- Synthesizes OCR data into precise search queries
- Multi-turn verification loop via LangGraph

### Component C — Forensic Verifier
- Live fetch + Wayback Machine API for archived snapshots
- Temporal consistency check
- Visual fingerprint comparison

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/EthanThatOneKid/postcard.git
cd postcard

# Install dependencies
npm install

# Add your API key
cp .env.example .env.local
# Edit .env.local and add GEMINI_API_KEY

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), upload a screenshot, and watch it trace.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Next.js | Responsive dashboard, easy API routes |
| AI / Vision | Gemini 2.0 Flash | Native vision + Google Search built-in |
| Agentic | LangGraph | Stateful multi-turn verification loops |
| Search | Toolhouse | Seamless browser/search tool integration |
| Storage | Milvus / Pinecone | Vector DB for UI fingerprints |

---

## File Structure

```
postcard/
├── DESIGN.md          # Full design doc
├── README.md          # This file
├── app/
│   ├── page.tsx       # Upload + results UI
│   └── api/
│       └── trace/
│           └── route.ts  # Gemini trace endpoint
├── components/
│   ├── Upload.tsx
│   ├── TravelLog.tsx
│   └── PostmarkScore.tsx
└── lib/
    ├── vision.ts      # Gemini vision parsing
    ├── navigator.ts  # Navigator agent
    └── score.ts      # Postmark Score logic
```
