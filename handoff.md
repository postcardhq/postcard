# Postcard Handoff

## Project Overview

Postcard is a digital forensics tool that takes a social media post URL, traces it back to its original source, and produces a postcard score (0–100%) measuring how much the content has drifted from the primary truth.

## Current State

### What's Working

1. **URL Input Flow** - Users can enter a post URL (Instagram, X, etc.) in the DropZone component
2. **Airmail Animation** - Visual envelope-to-airplane animation plays after URL submission
3. **SSE Pipeline** - AnalysisJourney connects to `/api/postcards` endpoint and streams progress
4. **Results Display** - Postcard shows "Postcard Score" and "Travel Log" with mock data
5. **E2E Test** - Playwright test passes for the happy path

### Tech Stack

- **Framework**: Next.js 16.2.2 with React 19
- **Styling**: Tailwind CSS v4 + CSS variables for postal theme
- **Animation**: Motion (framer-motion)
- **Testing**: Playwright
- **API**: SSE (Server-Sent Events) via `/api/postcards`

### Key Files

```
app/
├── page.tsx                    # Main page, handles URL → analyzing transition
└── api/postcards/route.ts     # SSE API endpoint, calls processTrace

components/ui/
├── Hero.tsx                    # Landing hero section
├── DropZone.tsx                # URL input form with airmail animation
└── AnalysisJourney.tsx         # SSE consumer + results postcard display

src/lib/
├── postcard.ts                 # processTrace() - main pipeline
├── vision/
│   ├── processor.ts           # Image preprocessing
│   └── ocr.ts                 # Text extraction
└── agents/
    ├── navigator.ts            # Search query builder
    ├── verifier.ts             # Origin verification
    └── corroborator.ts        # Primary source matching

tests/
└── happy-path.spec.ts         # E2E test
```

## Architecture

### User Flow

1. User lands on homepage → sees Hero + DropZone
2. User enters URL → clicks "Trace Post"
3. Airmail animation plays (envelope → folding → airplane → flying off)
4. AnalysisJourney mounts → fetches `/api/postcards` with SSE
5. Progress stages stream in: starting → scraping → corroborating → scoring → complete
6. Results postcard displays with score and travel log

### API Contract

**Endpoint**: `POST /api/postcards`
**Input**: JSON body `{"url": "https://...", "userApiKey?: "..."}`
**Output**: SSE stream

```json
// Progress event
{"stage": "scraping", "message": "Fetching content...", "progress": 0.3}

// Complete event
{"trace": { "postcardScore": 0.85, "corroboration": {...}, ... }}
```

## Open Questions

1. **Import rename mismatches** - `src/lib/postcard.ts` imports `extractPostmark` but exports `extractPostcard` (and similar for `auditPostcard`). Should I align the exports or update imports?

2. **LSP stale errors** - Shows errors for `@/src/lib/postcard` in `app/api/traces/route.ts` which doesn't exist. Likely stale cache.

3. **Results display** - Currently uses mock data in `ResultsPostcard`. Should I wire up real data from the SSE `complete` event?

4. **Error handling** - UI has error state but could show better error messages from the API.

## Next Steps (Brainstorm)

### High Priority

- [ ] Wire up real data from `complete` event to ResultsPostcard
- [ ] Fix import naming mismatches in `src/lib/postcard.ts`
- [ ] Add error UI for failed API calls

### Medium Priority

- [ ] Add more E2E tests (invalid URL, empty input, API errors)
- [ ] Improve stage messages from actual pipeline stages
- [ ] Add loading states for the input form

### Lower Priority

- [ ] Document API in OpenAPI spec
- [ ] Add rate limiting or API key management
- [ ] Consider caching/memoization for repeated URLs

## Decisions Made

- **SSE input format**: Using JSON body (not URL search params) to simplify OpenAPI spec generation
- **Endpoint**: `/api/postcards` (not `/api/traces`)
- **Score terminology**: "Postcard Score" (not "Postmark Score") in the UI
- **Path alias**: `@/src/*` added to tsconfig for clean imports
