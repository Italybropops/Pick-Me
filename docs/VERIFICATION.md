# MVP verification

Verified in the Codex Linux cloud workspace on 2026-10-12, using Node 24.19.0, npm 11.9.0, and system Chromium. All application scenarios and account-like observations used synthetic data.

| Check | Actual result |
| --- | --- |
| `npm ci --no-audit --no-fund` | Passed: 104 packages installed from the committed lockfile. `.npmrc` uses writable, ignored `.cache/npm/`; TLS and package integrity checks remain enabled. |
| `npm test` | Passed: **40 tests**, 2 files, no skipped tests. |
| `npm run build` | Passed: TypeScript checking and Vite production compilation. |
| `npm run schemas` | Passed: nine version-1 JSON Schema documents regenerated. |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser` | Passed: **8 tests**, no skipped tests. |
| Production browser smoke | Passed: HTTP 200, rendered application, expected local ready route, draft persistence after reload, no uncaught JavaScript errors, no horizontal overflow at 390 × 844. |
| CLI with synthetic workspace and injected clock | Passed: valid decision JSON with the expected ready provider. |
| Desktop/mobile inspection | Inspected actual Chromium renderings at 1440 × 1050 and 390 × 844. |
| `git diff --check` | Passed. Original `docs/CODEX_BUILD_PROMPT.md` preserved. |

## What was exercised

Unit/data checks cover private offline tasks; simple manual routes; image/video eligibility; missing capabilities; positive incremental cost; exhausted, unknown, stale, and shared allowances; near ties; exact-client model menus; local model readiness; commercial licensing conflicts; mandatory automation; stage bounds and privacy; incompatible or conflicting handoff formats; unfamiliar provider imports; unsafe/malformed/oversized/duplicate imports; round trips; evidence freshness with an injected clock; failed refresh and retrieval without false verification; browser storage errors; bounded history; maximum-length prompts/format metadata; and client changes that must not inherit another client's entitlements.

Browser checks exercise user-visible controls, inventory editing, export/download, import preview/cancel/apply, persistence, copy and clipboard-denied fallback, two comparison cards, a real two-stage workflow, inert imported markup, unsafe source rejection, no eligible $0 route, mobile overflow, source refresh failure/success with explicitly synthetic responses, explicit evidence review, keyboard activation/Escape/focus restoration, and absence of background external requests.

## Failures found and repaired

- An unnecessary CSS import prevented Vite from compiling; removed.
- React development effect cleanup closed dialogs prematurely; corrected modal lifecycle and focus restoration, then tested keyboard behavior.
- A valid long task exceeded the generated prompt schema limit; aligned the output bound and bounded retained history without trimming current task/inventory/draft.
- Large valid provider format lists exceeded a workflow-stage output bound; aligned the stage schema with the maximum input metadata.
- Changing a provider client could retain old personal access/cost observations; access is now scoped to the exact client. Legacy unscoped observations are preserved but require confirmation.
- A verified format claim could hide a conflicting format claim; all relevant claims now participate in the hard handoff check.
- A personal license checkbox could hide a standalone conflicting commercial claim; relevant evidence now remains conditional.
- Provider-edit validation could run inside a deferred React state updater; moved it before the update so errors stay in the editor. Editing is blocked while source retrieval is in flight to prevent stale refresh results overwriting a review.
- The default cloud npm cache was unwritable; `.npmrc` now uses a project-local ignored cache.

## Preview diagnosis

Opening the source HTML through a static HTTP server reproduced a module-load failure: the browser rejected `/src/main.tsx` served as `application/octet-stream`. Direct `file://` navigation was separately blocked by this cloud Chromium's administrator policy. Neither method invokes Vite's TypeScript/JSX compilation.

A development server left running while dependencies were reinstalled returned `504 Outdated Optimize Dep`. Restarting that server with `--force` repaired the stale dependency optimization. The restarted Vite server rendered the application; the production preview independently passed the functional browser smoke check.

The source HTML now displays launch instructions when scripts do not initialize. The embedded visualization host's internals and exact error are not exposed to this task, so its generic “Error occurred inside the visualization” message cannot be diagnosed more specifically. A running Vite/production server in a normal browser is the verified path; this environment does not expose a user-facing forwarded preview URL. See README for exact local launch commands.

## Remaining limits

- Linux Chromium was exercised, not macOS Safari, VoiceOver, actual Mac hardware, installed models, or real vendor accounts. The reported M2 Pro/16 GB configuration remains user-reported until confirmed.
- Several vendor documentation domains are blocked by cloud egress policy. Those claims remain uncertain; official repository claims were narrowly researched. Browser source refresh is also subject to CORS and rejects redirects. Offline registry import remains usable.
- Interpretation is keyword-based; ranking is a preference heuristic; workflow selection is bounded and greedy. No inference, automatic external actions, automatic retries, local-model install, or scheduled research runs.
- Inventory and imported verification are user assertions; the app cannot independently prove them. Local browser data is neither encrypted nor synced. Export backups deliberately.
- Vite emits two harmless third-party Zod comment-annotation warnings during the successful build. Playwright emits a terminal color-environment warning; it does not skip tests.
- Authenticated Git push works. GitHub CLI's API request returned `Forbidden`; a reviewable remote feature branch is available even when draft PR creation is blocked.

No paid API was enabled, no purchase made, no application publicly deployed, and no changes merged into `main`.
