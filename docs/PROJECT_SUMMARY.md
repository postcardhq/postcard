# Postcard project summary

> **Submission:** [Devpost](https://devpost.com/software/postcard-bpx2mz)
> **Team:** Ethan + Yves + Rohit  
> **Event:** PantherHacks 2026 (April 3–5, 2026)  
> **Track:** Cybersecurity  
> **Repository:** `postcard`

## What it does

Postcard is a digital forensics pipeline designed to rebuild trust in online media. It takes a social media URL (or a screenshot) and traces it back to its original source. The core of the project is the **Postcard Score (0–100%)**, a credibility metric calculated by auditing how much the content has drifted from the ground truth.

Tagline: _Trace the Truth._

## The problem

Screenshots strip all context. By the time something goes viral, it's been cropped, captioned, and stripped of its metadata—making it nearly impossible to tell if the content is authentic or a manufactured narrative. Postcard utilizes the **"Wisdom of the Crowd"** to provide a digital "wayback machine" for credibility, restoring the lost link between viral content and its primary source.

## How it works

User flow: Enter Post URL → Forensic Pipeline Runs → Postcard Score + Subscore Breakdown appears.

### Forensic Pipeline Stages

1. **Multimodal Ingest:** Utilizes Jina Reader to ingest live content and metadata, establishing the "ground truth" for the forensic audit.
2. **Forensic Audit:** Uses Playwright to perform direct site checks, verifying origin and ensuring temporal alignment with the reported narrative.
3. **Corroboration Engine:** Performs deep search across trusted domains to verify claims and find mentions of the content elsewhere to determine its "drift."
4. **Verification Platform:** Built with Next.js and Tailwind CSS, providing a clean, terminal-inspired interface for quick, simple forensic verification.

## Architecture

```
Post URL
    │
    ▼
┌───────────────────┐
│ 1. Ingest         │  Multimodal (Scanning Source)
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 2. Audit          │  Playwright — live site verification
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 3. Corroboration  │  Gemini-powered deep search
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 4. Verification   │  Terminal-inspired platform
└─────────┬─────────┘
          ▼
PostcardReport
```

## Tech stack

| Layer      | Choice                                       |
| ---------- | -------------------------------------------- |
| Framework  | Next.js 15+ (TypeScript)                     |
| Styling    | Tailwind CSS / Vanilla CSS                   |
| Hosting    | Vercel                                       |
| AI SDK     | Vercel AI SDK v6 (`@ai-sdk/google`)          |
| Model      | Gemini 2.0 Flash (OCR), Gemini 1.5/2.5 Flash |
| Database   | SQLite (libSQL for Turso)                    |
| Automation | Playwright + sharp                           |

## Key decisions

- **Postcard Score:** Weighted metric (Origin 30%, Corroboration 25%, Bias 25%, Temporal 20%).
- **Polling Architecture:** Replaced SSE with robust real-time polling for status updates and reliability.
- **Screenshot-to-URL:** Part of the original vision; a quality-of-life feature to resolve static screenshots to live URLs for verification.
