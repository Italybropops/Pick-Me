# Independent MVP audit and delivery

Audit date: **2026-10-13**. Repository: **Italybropops/Pick-Me**. Working branch: **feat/pick-me-mvp**. Review target: **main**.

Baseline verified from the actual local checkout and remote Git refs: `11937fe86ccfb23ebd88b0a0004ac8774e43bc8c`; main was `8c640f505d3a418a36bacd43740eacc786a13ff3`. The checkout was clean before the audit. Audited repair/software commit: **`9facb99bd4ac6b4a8c7760c1623ae315aa9653a3`**. A documentation-only delivery commit adds this report; its exact SHA is recorded in the exported audit report and final delivery response.

Read README.md, AGENTS.md, and docs/CODEX_BUILD_PROMPT.md completely. The original MVP specification is the scope authority and remains unchanged. No conflicting feature scope was found. The October 12 verification report is historical, not evidence that this audit's newly probed edge cases were already tested.

The audit reused React/Vite/Zod, Vitest, Playwright, system Chromium, and the existing lockfile. No application dependency, architecture, visual design, or schema version was upgraded. Only justified repairs, regression tests, documentation, and the explicitly requested planned roadmap entry were added. No additional agents were dispatched. All test data, imports, drafts, and account-like observations were synthetic.

## Classification rules

- **PASS**: executed successfully with the evidence cited below; limited to that tested behavior.
- **FAIL**: reproduced defect; initial failures are recorded separately from their repaired final outcomes.
- **NOT RUN**: no execution/verification; the reason is explicit.
- **NOT APPLICABLE**: outside this MVP's documented scope.

## Requirements verification matrix

| Requirement | Final classification | Supporting evidence / limits |
| --- | --- | --- |
| A: Required incremental cost above $0 must be excluded | PASS | Existing core tests for positive cost/missing capability, allowance exhaustion, and browser no-eligible-video route. Weights cannot bypass the filters. |
| A: Unknown access, cost, or allowance must not become ready | PASS | Core and storage tests cover unknown/exhausted/stale access, unscoped legacy entries, exact-client access, free setup, and reset dates that do not replenish quota. |
| A: Contradictory cost evidence cannot be ignored | PASS | Repaired AUD-05; `tests/audit.test.ts` independently adds a cost-only conflict without conflicting capability evidence. |
| A: Every workflow stage must preserve cost/privacy and shared demand | PASS | Existing core tests for two-stage $0 routes, shared measured quota overdraw, unknown demand, incompatible handoffs, private-cloud exclusion, and stage bounds. |
| A: Real subscription/credit entitlements and account quotas | NOT RUN | No real accounts or credentials were supplied/used. Inventory values are dated user assertions, not independently verified account access. |
| B: Capability filtering and explainable rankings | PASS | Core fixtures for writing, image, video, missing capabilities, simple manual routes, comparisons, and bounded toolchains; browser comparison/workflow test. |
| B: Exact-client model/reasoning menus and changing availability | PASS | Core tests distinguish a menu from another client, current supported settings, unknown menus, stale observations, and downloaded-model/hardware prerequisites. This tests rules, not a vendor's actual menu. |
| B: Contradictory quality evidence cannot inflate ranking | PASS | Repaired AUD-06; an independently added quality-only conflict keeps quality neutral at 2.5/5. |
| B: Comparative probabilities or calibrated model performance | NOT APPLICABLE | Scores are explicitly preference heuristics. No measured production benchmark or inference integration is required by the MVP. |
| C: Inventory creation/editing and reload persistence | PASS | Browser test edits LibreOffice access/cost/allowance, records an observation, saves, reloads, and checks persisted data. Unit tests cover persistence and storage errors. |
| C: Drafts and newer claims survive delayed source refresh | PASS | Repaired AUD-02; delayed-response browser regression preserves the draft after navigation. Core regressions preserve newer claims/dates and ignore results for changed URLs. |
| C: Browser data isolation and private local route | PASS | Production Chromium smoke saves/reloads a synthetic private draft, confirms the local ready route, and verifies a separate browser context starts with an empty draft. Per-origin/profile boundaries are also documented. |
| C: Absence of hidden task transmission/telemetry | PASS | Browser test observes no background external requests; production smoke likewise records none. Source inspection finds the only application fetch in explicit source refresh, with omitted credentials/referrer and no task body. |
| C: Encryption, cloud synchronization, and account signup | NOT APPLICABLE | MVP uses unencrypted localStorage and deliberate JSON backups. The README states its boundaries and clearing-data risks. |
| D: Source fields, honest unknowns, and evidence freshness | PASS | Seed-record tests verify eight providers and no invented external personal access. Core tests use an injected clock for uncertain, stale, and conflicting claims. Public records retain source/type/scope/date/freshness metadata. |
| D: Fetching does not verify; failed refresh preserves evidence | PASS | Existing unit/browser tests separately check fetchedAt and verifiedAt. New merge tests preserve the latest retrieval on late failures/older responses. Browser responses used in tests are explicitly synthetic. |
| D: Source/provenance/provider edits must not inherit verification | PASS | Repaired AUD-03/AUD-04; browser regressions change provenance and URL. Core regressions invalidate changed capability facts and require explicit review to promote conflicts. |
| D: Current live vendor claims, pricing, regions, actual model menus | NOT RUN | This audit did not reverify vendor facts or real accounts. Existing researched dates remain historical; blocked/unverified sources remain uncertain. Controlled retrieval tests do not establish live vendor verification. |
| E: Versioned JSON import/export round trip | PASS | Existing import/round-trip tests, browser preview/cancel/apply/download, and repaired AUD-01 compact-versus-formatted size regression. No fields are dropped to fit the bound. |
| E: Malformed, incomplete, oversized, duplicate, or unsafe imports | PASS | Core tests reject bad JSON/versions/records, oversized input, duplicate IDs, and unsafe URLs; browser tests reject javascript URLs and render imported markup inertly before replacement. |
| E: Recovery from corrupt/unavailable storage | PASS | Storage tests preserve corrupt originals and surface quota failures; app source pauses saving on load errors and cross-tab changes. |
| E: Future local-agent callable interface and schemas | PASS | Schema generation produces nine v1 documents unchanged; synthetic CLI evaluation returns the expected decision. No interpreter can bypass core validation/hard filters. |
| F: Mobile layout and all navigation screens | PASS | New browser audit traverses all four screens at 390 × 844 and checks page overflow. Production mobile/desktop renderings were inspected. |
| F: Essential keyboard/dialog/copy behavior | PASS | Browser tests cover Enter activation, Tab staying inside native modal, Escape/focus restoration, clipboard copying, and denied-clipboard fallback. |
| F: End-to-end essential workflow | PASS | Browser tests exercise task interpretation, private/no-budget routes, editing inventory/evidence, comparisons, a two-stage chain, backup/replacement, and reload. |
| F: Safari, VoiceOver, full WCAG conformance, actual Mac/model resources | NOT RUN | Only Linux Chromium was available. Basic keyboard/mobile checks do not establish screen-reader or cross-browser conformance. |
| Phase 2 evaluator functionality | NOT APPLICABLE | Requested as a proposal only. `docs/ROADMAP.md`, “Phase 2 — Software Pre-Installation Evaluator,” is explicitly PLANNED / NOT IMPLEMENTED. |

## Executed commands and results

Environment: Node **24.19.0**, npm **11.9.0**, Linux, existing `/usr/bin/chromium`.

| Command/check | Result |
| --- | --- |
| `npm ci` | PASS — 104 packages installed using the unchanged committed lockfile. Existing `.npmrc` used ignored `.cache/npm/`; TLS/checksum verification stayed enabled. |
| Baseline `npm run check` | PASS — 40 unit tests in 2 files, followed by TypeScript checking and production build. |
| Baseline `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser` | PASS — 8 browser tests. |
| Initial `npm test -- tests/audit.test.ts` | FAIL — 3 independent reproductions: oversized formatted export, ignored cost conflict, and inflated conflicting quality score. |
| Initial targeted browser audit | FAIL — provenance and source-URL metadata defects; the refresh case was then rerun with an advanced fixed clock so it observed the completed response and directly reproduced the lost draft. |
| Repaired targeted unit audit | PASS — 9 tests, including the three initial defects and evidence-edit/refresh boundaries. |
| Repaired targeted browser audit | PASS — 3 regression cases. |
| Final `npm run check` | PASS — **49 unit tests in 3 files**, no skipped tests; TypeScript check and production build passed. |
| Final `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser` | PASS — **12 browser tests**, no skipped tests. |
| `npm run schemas` and diff against tracked schemas | PASS — regenerated nine documents; no schema/lockfile/specification changes. |
| Production preview via `npm run preview -- --port 4183 --strictPort` | PASS — HTTP 200, rendered private local route, draft persistence after reload, independent browser-context isolation, no uncaught JavaScript errors, no background external requests, no horizontal mobile page overflow. |
| `npx tsx scripts/recommend.ts /tmp/pickme-audit-cli-input.json 2026-10-12T12:00:00.000Z` | PASS — synthetic decision JSON contained the expected ready provider. |
| Source/diff/private-path and credential-pattern review | PASS — no flagged credential patterns or private/generated paths in source changes; all new fixtures synthetic. A pattern scan is not a universal secret detector. |
| `git diff --check` | PASS. |

The successful Vite build emits two existing third-party Zod comment-annotation warnings. Playwright emits a terminal color-environment warning. Neither disables validation or skips tests. Raw temporary fixtures/screenshots are outside Git; test-generated outputs remain ignored.

## Actual defects and targeted corrections

| ID | Initial outcome and reproduction | Correction and final evidence |
| --- | --- | --- |
| AUD-01 | FAIL: a valid synthetic workspace measured 1,526,034 bytes compact but 2,015,601 bytes formatted. Import succeeded; export threw the 2 MB size error. | `exportWorkspace` uses compact JSON when formatting alone exceeds the bound, then validates the export. Regression verifies complete equality after reimport. |
| AUD-02 | FAIL: begin source refresh, navigate to routes, save a draft, finish response; captured state replaced the newer draft with an empty one. | Refresh applies only retrieval metadata to the latest workspace. Normal provider saves preserve other current fields. Browser delayed-response and core latest-claim/URL/failure regressions pass. |
| AUD-03 | FAIL: advanced JSON editor changed sourceType while retaining verifiedAt/status; changed provider facts could likewise retain unrelated proof. | Shared edit helpers invalidate materially changed provenance/topics/facts, preserve explicit conflicts, prevent unreviewed promotions, and do not accept manually forged retrieval dates. Browser and core regressions pass. |
| AUD-04 | FAIL: changing an evidence URL kept fetchedAt for the previous URL. | Source changes clear old retrieval/error metadata; unchanged URLs retain their actual retrieval independently of claim review. Browser regression passes. |
| AUD-05 | FAIL: a fresh personal $0 observation hid a standalone conflicting cost claim, producing ready. | Relevant contradictory cost evidence requires verification and remains conditional. New independent core regression passes. |
| AUD-06 | FAIL: one fresh benchmark inflated quality despite another conflicting quality-only claim. | All relevant quality claims must be current/verified before a benchmark can affect the quality score; otherwise neutral. Regression passes. |

No reproduced essential in-scope defect remains unresolved in the tested scenarios. This is not proof against every possible bug. The large-data regression keeps the existing 2 MB bound; data that actually exceeds it must still be reduced before import/backup. A greedy workflow planner and keyword interpreter remain intentional MVP limits. Generic comparison guidance could be more tailored, but redesign/richer semantics were not necessary to repair a verified critical workflow.

## Delivery and review

Authorized work remains on `feat/pick-me-mvp`; no merge or deployment is performed. Compare the complete MVP against main:

```sh
git fetch origin
git diff origin/main...origin/feat/pick-me-mvp
```

For audit-only code changes, compare baseline `11937fe86ccfb23ebd88b0a0004ac8774e43bc8c` with repair commit `9facb99bd4ac6b4a8c7760c1623ae315aa9653a3`.

GitHub PR inspection with `gh pr list --repo Italybropops/Pick-Me --head feat/pick-me-mvp --state all --json number,url,state` returned `Post https://api.github.com/graphql: Forbidden`. Read-only Git pull-ref enumeration returned no refs, which does not establish the absence of an open PR under the API access restriction. To avoid a duplicate, no new PR is created while existing-PR state cannot be confirmed. The pushed branch/comparison is the reviewable fallback. If API access is restored, check for an existing PR before creating one targeting main.

## Reproducible application checks

From the repository root with Node >=22.12:

```sh
npm ci
npm run dev -- --port 5173 --strictPort
```

Open `http://127.0.0.1:5173` on the same machine. Source `index.html` is a Vite entry, not a standalone visualization. Stop the dev server before reinstalling dependencies; if Vite reports stale optimized dependencies, restart with `--force`.

```sh
npm test
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
npm run build
npm run preview -- --port 4173 --strictPort
```

On a Mac without system Chromium, use `npx playwright install chromium` then `npm run test:browser`; that local Mac execution was NOT RUN in this cloud audit. Preview uses a different storage origin; use backup/import when transferring data between dev and preview.

Manual essential workflow: run the checklist example; edit the structured interpretation/privacy flags; find a route; copy its brief; save/reload a synthetic draft; edit a tool's client-specific cost/allowance/model observations; export; preview and cancel an import before deliberately applying it; inspect a scoped evidence claim; refresh only on demand; verify fetched/verified dates remain separate. Try a private task and a video task with no verified free access to inspect the distinct ready/conditional/excluded behavior.

Phase 2 is documented in **docs/ROADMAP.md → Phase 2 — Software Pre-Installation Evaluator**, with expected hardware/privacy/security/cost/installed-alternative inputs, explainable outputs, and high-level acceptance criteria. It remains **PLANNED / NOT IMPLEMENTED**.
