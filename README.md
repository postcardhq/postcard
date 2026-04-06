# Postcard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![AI SDK](https://img.shields.io/badge/AI_SDK-6.0-black)](https://sdk.vercel.ai/)
[![Gemini](https://img.shields.io/badge/Gemini-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Turso](https://img.shields.io/badge/Turso-202020?logo=turso&logoColor=white)](https://turso.tech/)
[![Drizzle](https://img.shields.io/badge/Drizzle-C5F74F?logo=drizzle&logoColor=000)](https://orm.drizzle.team/)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)

> _Trace the Truth._

![Postcard Illustration](./public/postcard-illustration.png)

Postcard is a digital forensics tool dedicated to tracing viral content back to its definitive source. By auditing how much a post has drifted from the ground truth, it calculates a **Postcard Score** to restore credibility in the post-truth era.

## Hackathon submission

**Track:** [Cybersecurity](https://pantherhacks2026.devpost.com/)\
**Submission:** [Devpost](https://devpost.com/software/postcard-bpx2mz)\
**Demo:** [postcard.fartlabs.org](https://postcard.fartlabs.org)\

## Pipeline architecture

```mermaid
sequenceDiagram
    participant U as Verification Platform (/postcards)
    participant API as API Route (/api/postcards)
    participant P as Forensic Pipeline
    participant I as UnifiedPostStrategy (oEmbed/Jina)
    participant C as Corroborator Agent (Gemini)
    participant V as Verifier Agent (Gemini)
    participant DB as Database (Turso)

    U->>API: POST /api/postcards { url: "https://x.com/..." }
    API-->>U: HTTP 202 { postcardId, status: "processing" }

    API->>P: processPostcardFromUrl(url, postcardId)
    P->>DB: Update progress (stage, message, progress)

    alt Cache Hit
        DB-->>P: Return cached report
    else Cache Miss
        P->>I: unifiedPostClient.fetch(url)
        I-->>P: High-fidelity Markdown
        P->>DB: Update progress (stage: "scraping", progress: 0.1)

        P->>C: corroboratePostcard(content)
        C-->>P: Independent Evidence & Verdict
        P->>DB: Update progress (stage: "corroborating", progress: 0.4)

        P->>V: auditPostcard(url, postcard)
        V-->>P: Origin & Temporal Scores
        P->>DB: Update progress (stage: "auditing", progress: 0.7)

        P->>P: Calculate Postcard Score
        P->>DB: Persist analysis (status: "completed", progress: 1)
    end

    P-->>API: PostcardResponse + ForensicReport
    API-->>U: (via polling)

    Note over U: Polls GET /api/postcards?url=...<br/>every 3 seconds for status
    Note over U: When status="completed", displays report
```

## Flow

**User flow:** Enter Post URL → Forensic Pipeline Runs → Postcard Score +
Subscore Breakdown appears.

Postcard prioritizes the direct URL entrypoint to ensure absolute forensic
precision, while maintaining support for screenshot-to-URL resolution as an
additional quality-of-life feature.

## Product

Postcard is a digital forensics pipeline that takes a social media post URL,
traces it back to its original source, and produces a postcard score
(0–100%) measuring how much the content has drifted from the truth.

> _Trace the Truth._

## The problem

Screenshots strip all context. By the time something goes viral, it's been
cropped, captioned, and misattributed. Postcard utilizes the **"Wisdom of the Crowd"**
to triangulate the primary source and audit it for forensic consistency—providing a
scalable solution for restoring context and credibility.

### Solution

We built a 4-stage forensic pipeline focused on deep audit log generation and
corroboration for social media posts:

1. **Multimodal Ingest:** Utilizes Jina Reader to ingest live content and metadata, establishing the "ground truth" for the forensic audit.
2. **Forensic Audit:** Uses Playwright to perform direct site checks, verifying origin and ensuring temporal alignment with the reported narrative.
3. **Corroboration Engine:** Performs deep search across trusted domains to verify claims and find mentions of the content elsewhere to determine its "drift."
4. **Verification Platform:** Built with Next.js and Tailwind CSS, providing a clean, terminal-inspired interface for quick, simple forensic verification.

## Lessons learned

A key technical takeaway from this hackathon was discovering how oEmbed APIs
can significantly enhance verifiable OSINT. While traditional scraping is
often blocked or inconsistent, leveraging official oEmbed endpoints (like those
from X, Instagram, and YouTube) provides a reliable, high-fidelity way to
capture metadata—such as author information and exact timestamps—directly from
the source without the fragility of manual extraction.

## Documentation

- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md): Comprehensive
  [Quick start](docs/CONTRIBUTING.md#quick-start) guide, technical stack,
  and architecture notes.
- [docs/DESIGN.md](docs/DESIGN.md): Full technical specification and
  pipeline stages.
- [docs/devpost.md](docs/devpost.md): High-level summary for
  the PantherHacks 2026 Devpost submission.
- [docs/PITCH.md](docs/PITCH.md): Pitch script and video cues.
- [Mintlify Documentation](https://www.mintlify.com/postcardhq/postcard): Hosted, interactive documentation for Postcard.
- [API Reference](https://postcard.fartlabs.org/api/reference): Interactive API reference (Scalar).
- [docs/API.md](docs/API.md): Full API reference with examples.
- [public/openapi.json](public/openapi.json): OpenAPI v3.1 Specification for SDK generation.

---

Built with 🐈‍⬛ at [PantherHacks 2026](https://pantherhacks2026.devpost.com/)
