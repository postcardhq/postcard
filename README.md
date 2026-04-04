# Postcard

> _Trace every post back to its source._

Postcard is a digital forensics tool that takes a screenshot of a social media post and traces it to its origin — calculating how much the content has drifted from the original along the way.

## The problem

Screenshots are the primary currency of misinformation. They strip context, remove timestamps, and are easily manipulated. A viral screenshot often removes the original author's byline, date, and any subsequent corrections. Postcard reverses this entropy by finding the primary source and auditing it for forensic consistency.

**Track:** PantherHacks 2026 — Cybersecurity  
**Team:** Ethan + Yves  
**Stack:** Next.js · Gemini (Google AI) · AI SDK v6 · Drizzle ORM + Turso/libSQL

---

## What it does

1. **Upload** a screenshot of any social media post.
2. **Vision parse** — Gemini extracts text, handles, timestamps, and engagement counts.
3. **Navigator agent** — Gemini synthesizes high-precision search queries to find the primary source.
4. **Multimodal auditor** — Gemini verifies the source URL, timestamp consistency, and visual fingerprints.
5. **postcard score** — The system calculates the final verdict and provides a forensic audit trail.

---

## Technical blueprint

For the full technical specification, including Zod schemas, database ERD, and component breakdown, see the **[design document](DESIGN.md)**.

---

## Quick start

```bash
git clone https://github.com/EthanThatOneKid/postcard.git
cd postcard
npm install
cp .env.example .env.local
# Add GEMINI_API_KEY, TURSO_DATABASE_URL, and TURSO_AUTH_TOKEN to .env.local
npx drizzle-kit push
npm run dev
```

---

## Tech stack

| Layer         | Choice                     | Why                                                 |
| ------------- | -------------------------- | --------------------------------------------------- |
| Frontend      | Next.js                    | Responsive dashboard and fast API routes.           |
| AI / Vision   | Gemini 2.5/3               | Native vision and Google Search grounding built-in. |
| Orchestration | AI SDK v6                  | Idiomatic structured output and tool integration.   |
| Storage       | Drizzle ORM + Turso/libSQL | Type-safe persistence with low cold-start SQLite.   |

---

## Roadmap

Implementation progress is tracked via the **[GitHub roadmap issue #12](https://github.com/EthanThatOneKid/postcard/issues/12)**.

## Project structure

All technical documentation is consolidated in **[DESIGN.md](DESIGN.md)**.

```bash
postcard/
├── DESIGN.md          # Full design doc
├── README.md          # This file
├── src/
│   ├── app/
│   │   ├── page.tsx          # Landing + upload
│   │   ├── dashboard/page.tsx
│   │   └── api/process/
│   │       └── route.ts     # Trace endpoint
│   ├── lib/
│   │   ├── vision/
│   │   │   ├── processor.ts  # Image preprocessing
│   │   │   └── ocr.ts       # Gemini vision OCR
│   │   ├── agents/
│   │   │   ├── navigator.ts # Search query synthesis
│   │   │   └── verifier.ts  # Forensic checks
│   │   └── postcard.ts      # Core scoring logic
```
