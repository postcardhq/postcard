# Manual Testing & Verification Guide

This guide provides a structured checklist for manually verifying the Postcard forensic pipeline, dynamic social cards (OG images), and public API consistency.

## Environment Configuration

Before testing, toggle the "Fake" or "Real" pipeline in your `.env` file:

- **Logic / UI Testing (Instant results)**:
  ```env
  NEXT_PUBLIC_FAKE_PIPELINE=true
  NEXT_PUBLIC_FAKE_PIPELINE_DELAY=2000
  ```
- **Fidelity / AI Testing (Production agents)**:
  ```env
  NEXT_PUBLIC_FAKE_PIPELINE=false
  GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
  ```

---

## 1. Forensic Pipeline Hardening

**Scenario**: Testing the fix for "Eternal Spinner" UI stalls.

1.  Navigate to `/postcards`.
2.  Submit a URL containing the word **"fail"** (e.g., `https://x.com/user/status/fail-test`).
3.  **Expected**:
    - The airmail animation starts immediately.
    - After the set delay, the UI transitions to a **"failed"** state with an error message.
    - Polling requests cease immediately upon failure.

## 2. Dynamic Social Cards (OG Images)

**Scenario**: Verifying branded social media embeds.

1.  Complete any analysis and copy the **Postcard ID** from the URL.
2.  Open your browser to: `/api/postcards/[ID]/og`
3.  **Expected**:
    - You see a rendered PNG image with a vintage "Forensic Report" aesthetic.
    - The score stamp color matches the severity (Green/Yellow/Red).
    - Verdict and summary text are dynamic.

## 3. Public API (202 Accepted Lifecycle)

**Scenario**: Verifying standard polling patterns for third-party consumers.

1.  Trigger a new trace:
    `POST /api/postcards` with JSON `{"url": "..."}`.
2.  Immediately poll the status:
    `GET /api/postcards?url=...`
3.  **Expected**:
    - Returns **HTTP 202 Accepted** while processing.
    - Returns **HTTP 200 OK** with the full report object once complete.

## 4. Grounding & Agent Throttling

**Scenario**: verifying service-owner cost/depth controls.

1.  In `.env`, set `POSTCARD_MAX_TOOL_CALLS=2`.
2.  Run a real (non-fake) trace.
3.  **Expected**:
    - The Agent stops searching after exactly 2 "Search Tool" executions.
    - Verification: Check the **Corroboration Log** in the report UI.
