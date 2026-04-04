# Postcard design document

> **Team:** Ethan (lead) + Yves  
> **Event:** PantherHacks 2026 (April 3–5, 2026)  
> **Track:** Cybersecurity  
> **Stack:** Next.js · Gemini 2.5/3+ · AI SDK v6 · SQLite · Jina Reader

---

## Project vision

Postcard reverses the entropy of social media screenshots by tracing them back to their source. When users upload a screenshot, Postcard locates the original post, fetches its live metadata, and calculates a **Postmark score** to reveal how much the content has drifted from the truth.

### Core problem
Screenshots strip context. Cropped text, missing timestamps, and altered engagement counts make it easy to spread misinformation. Postcard restores that context by finding the primary source and auditing it for forensic consistency.

### Out of scope
- Tracing multi-step attribution chains.
- Wayback Machine historical lookups (deferred for MVP).
- Mobile application (web-first for hackathon).

---

## Technical architecture

Postcard operates as a sequential pipeline using **AI SDK v6** for structured forensic extraction and grounding.

### Pipeline stages

#### 1. Image preprocessor
The preprocessor uses **Sharp** to normalize contrast, adjust brightness, and sharpen the image. This optimization ensures high-quality OCR results in the next stage.

#### 2. OCR and postmark extraction
Gemini 2.5/3+ analyzes the processed image to extract structured metadata into a **Postmark** object.

```typescript
import { z } from 'zod';

export const PostmarkSchema = z.object({
  username: z.string().optional().describe('Found handles like @username'),
  timestampText: z.string().optional().describe('Relative or absolute timestamp (e.g. "2h ago")'),
  platform: z.enum(['X', 'YouTube', 'Reddit', 'Instagram', 'Other']).default('Other'),
  engagement: z.object({
    likes: z.string().optional(),
    retweets: z.string().optional(),
    views: z.string().optional(),
  }).optional(),
  mainText: z.string().describe('The primary text content of the post'),
});
```

#### 3. Navigator agent
The navigator agent synthesizes high-precision search queries from the postmark metadata. It uses the AI SDK `googleSearch` tool to triangulate candidate source URLs.

**Jina Reader integration:** Once the agent identifies a candidate URL, it uses the **Jina Reader API** (`https://r.jina.ai/<url>`) to fetch the full page content as LLM-ready Markdown. This process ensures the system captures the full forensic context (character-by-character text, exact timestamps) while stripping away noise like ads or navigation bars.

**Google dorking strategy:** The agent acts as a Google dork expert, using site-specific operators to narrow the search space:

| Platform | Operator Example | Purpose |
| :--- | :--- | :--- |
| **X (Twitter)** | `site:twitter.com intext:"exact phrase"` | Find specific posts by content. |
| **YouTube** | `site:youtube.com "video title"` | Locate specific video descriptions. |
| **Reddit** | `site:reddit.com/r/subreddit "thread title"` | Narrow to specific communities. |
| **Instagram** | `site:instagram.com "caption text"` | Trace visual posts with text clues. |

#### 4. Multimodal auditor
The auditor compares the original screenshot against the Jina-rendered Markdown and search results. It calculates scores for origin reachability, temporal consistency (60-second window match), and visual signature alignment (platform-specific icons and layouts identified from the screenshot).

---

## Database schema

Postcard uses **SQLite** for server-side caching and forensic log storage. This ensures instant responses for previously analyzed images.

### Entity relationship diagram

```mermaid
erDiagram
    analyses {
        text id PK
        text status
        text created_at
    }
    screenshots {
        text id PK
        text analysis_id FK
        text sha256 UNIQUE
        blob data
    }
    posts {
        text id PK
        text analysis_id FK
        text url
        text platform
        text post_text
    }
    judgments {
        text id PK
        text analysis_id FK
        text subscore_type
        real score
        text reasoning
    }

    analyses ||--o{ screenshots : "contains"
    analyses ||--o{ posts : "resolves to"
    analyses ||--o{ judgments : "receives"
```

### Table definitions

```sql
CREATE TABLE analyses (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE screenshots (
    id TEXT PRIMARY KEY,
    analysis_id TEXT REFERENCES analyses(id),
    sha256 TEXT UNIQUE NOT NULL,
    data BLOB NOT NULL
);

CREATE TABLE judgments (
    id TEXT PRIMARY KEY,
    analysis_id TEXT REFERENCES analyses(id),
    subscore_type TEXT NOT NULL, -- 'corroboration', 'bias', 'temporal'
    score REAL NOT NULL,
    reasoning TEXT
);
```

---

## Postmark score logic

The system combines subscores into a weighted percentage (0–100%).

### Weighted formula
```javascript
// Score weights are arbitrary for the hackathon and easily adjustable.
const WEIGHTS = {
  ORIGIN:   0.40, // URL reachability
  TEMPORAL: 0.30, // Timestamp consistency
  VISUAL:   0.30, // UI fingerprint alignment
};

const TotalScore = (O * WEIGHTS.ORIGIN) + (T * WEIGHTS.TEMPORAL) + (V * WEIGHTS.VISUAL);
```

### Subscore definitions
- **Origin (O):** Binary check. Is the source URL reachable and platform-consistent?
- **Temporal (T):** Proximity check. Does the screenshot timestamp match the metadata found online?
- **Visual (V):** UI audit. Do buttons, logos, and layout match the expected platform's "fingerprint"?

---

## User interface

- **Minimalist dark mode:** Postcard uses a sleek black background with vibrant accent colors for scores.
- **Drag-and-drop:** Users upload screenshots via a central landing zone.
- **Real-time audit log:** The dashboard displays live updates (e.g., "Synthesizing queries...", "Auditing source...") to keep users engaged.
- **Progressive disclosure:** The interface shows the high-level score first, then allows users to expand for a detailed subscore breakdown and LLM reasoning.

---

## Technical task breakdown

### Phase 1: The foundation
- **Task 1 (Yves):** Initialize Next.js project and build the "Evidence Upload" landing page.
- **Task 2 (Ethan):** Configure AI SDK v6 environment variables and the SQLite schema.

### Phase 2: Vision and search
- **Task 3 (Yves):** Implement Stage 1 & 2 (Sharp preprocessing + Gemini postmark extraction).
- **Task 4 (Ethan):** Implement Stage 3 (Navigator agent with `googleSearch` and Jina Reader integration).

### Phase 3: Audit and score
- **Task 5 (Yves):** Build the multimodal auditor (Stage 4) using Gemini to verify content consistency.
- **Task 6 (Ethan):** Implement the weighted logic for the Postmark score and sync results to SQLite.

### Phase 4: Frontend polish
- **Task 7 (Yves):** Build the "Travel Log" dashboard component with color-coded alerts.
- **Task 8 (Ethan):** Implement the real-time "Loading State" logs to reflect the backend audit trail.
