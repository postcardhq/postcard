# Postcard Handoff

## Current Status
- Replaced "reverse entropy" with "Wisdom of the Crowd" and established the final "Trace the Truth" branding across all documentation.
- The pipeline architecture in the UI and test suites has been updated to use polling.
- Fixed an issue where the analysis journey would hang at "Evidence en route..." by modifying the `GET /api/postcards` route to correctly pass `progress` and `stage` metadata to the client.
- Fixed root redirect issues in the `ForensicReport`, `AnalysisJourney`, and `DropZone` components that were erroneously pushing users to `/` instead of `/postcards`.
- `NEXT_PUBLIC_FAKE_PIPELINE=true` is enabled in `.env` to ensure stability for demonstrations.

## Remaining Known Issues
- Playwright screenshot tests (`tests/screenshot.spec.ts`) may sometimes timeout due to minor sync issues between the mock processing animation delays and Playwright's expectations, occasionally causing incomplete final asset generation. This requires a small tweak to the test wait times.

## Next Steps
- Validate that the mock progress polling correctly triggers the transition to `stage 4` (Results view) in all browser environments.
- Regenerate the final Devpost submission screenshots once the timing on the UI animation transition is smoothed out.
- Prepare staging or presentation scripts focusing on the "Wisdom of the Crowd" feature and timeline elements.
