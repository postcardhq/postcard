# Postcard pitch script (2 mins)

Objective: Deliver a clear, technically impressive demonstration of the Postcard forensic pipeline for PantherHacks 2026.

### Problem

- Visual: Dashboard intro
- Script: "Every day, thousands of misleading social media screenshots circulate the web. They lack context, original links, and accountability. How do we know if a viral 'receipt' is actually real or just edited? Meet Postcard. We don't just fact-check; we **Trace the Truth**."

### Solution

- Visual: Show the DropZone with the airmail animation.
- Script: "Postcard is a digital forensics pipeline designed to trace any social media post back to its source. We utilize the **'Wisdom of the Crowd'** to triangulate a post's definitive source from even a low-quality screenshot. When you drop a URL into our system, we don't just look at the text—we audit the underlying metadata."

### Tech stack

- Visual: Tech stack slide
- Script: "We use a 4-stage forensic pipeline powered by Google Gemini and the Vercel AI SDK.
  1. First, we perform a **Multimodal Ingest** to establish ground truth.
  2. Next, our **Forensic Audit** uses Playwright to verify the origin site.
  3. Our **Corroboration Engine** then performs deep search across trusted domains to identify the primary source.
  4. Finally, everything is served through our **Verification Platform** for quick, technical validation."

### Score

- Visual: Show the Travel Log dashboard with scores (e.g., 85/100).
- Script: "All this data is distilled into a **Postcard Score**. It’s a technical audit trail measuring content drift. We check engagement metrics, absolute timestamps, and cross-platform consistency to give a clear verdict on the post's integrity."

### Closing

- Visual: Show the final "dispatch" animation and the Devpost track logo (Cybersecurity).
- Script: "Postcard brings transparency back to social media by **Tracing the Truth** directly to the source. We're democratizing honesty through technical verification. Thank you."
