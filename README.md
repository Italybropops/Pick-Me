# Pick-Me

Personal Tool and Workflow Selector.

## Goal

Describe a task and receive an explainable recommendation for an app, model, supported reasoning setting, optional integrations, or a sequence of tools. Compare close alternatives and preserve dated evidence.

## Project constraints

- No additional spending, paid APIs, paid hosting, paid credits, auto-recharge, or payment-required trials.
- Keep personal inventory, private tasks, account details, credentials, and exports out of this public repository. Use synthetic examples in source control.
- Separate provider capabilities and supporting evidence from personal access and allowances.
- Prefer a lightweight browser application with portable, versioned JSON and an explainable rules-based baseline.
- Design for eventual local-model or local-agent integration without requiring one for the MVP.
- Do not merge or publicly deploy application changes without explicit approval.

## Current state

The MVP is a responsive, local-first React/TypeScript browser application with an independent, deterministic recommendation engine. No API keys, inference services, accounts, Docker, database, or model downloads are needed. The original build specification is preserved in [docs/CODEX_BUILD_PROMPT.md](docs/CODEX_BUILD_PROMPT.md).

## Try it locally

Use Node.js **22.12+** (Node 24 was tested) and npm. From the repository root:

```sh
npm ci
npm run dev -- --port 5173 --strictPort
```

Open `http://127.0.0.1:5173` in your own browser. Keep that origin and port consistent to reuse browser data. The development server binds to loopback. Stop it with Ctrl+C. To try a production build locally:

```sh
npm run build
npm run preview -- --port 4173 --strictPort
```

Open `http://127.0.0.1:4173`. This is a different storage origin; use export/import if moving data from the development server. Neither command publishes anything. After dependencies are installed, the app runs offline from a local server; it does not install a service worker or promise offline access to a remote host.

### Source-file and embedded previews

Do not open the repository's `index.html` as a standalone HTML visualization. It references a TypeScript/JSX entry module that Vite must compile and serve. A file renderer can reject local files, fail to serve the source modules, or display “Error occurred inside the visualization” before the app starts. The HTML includes launch instructions as a fallback when scripts cannot run. This cannot change the hosting application's own preview-renderer restrictions.

The supported preview is the running local server above, opened in a browser on that machine. A remote cloud loopback URL is not reachable from your Mac without a supported port-forwarding facility; this onboarding interface does not provide one. Clone/download the feature branch and run it locally, or use a development environment that explicitly supports forwarding its Vite port. No public deployment is required. If you reinstall dependencies while Vite is already running and see `504 Outdated Optimize Dep`, stop the server and restart with `npm run dev -- --port 5173 --strictPort --force`.

The repository `.npmrc` stores npm's cache in ignored `.cache/npm/`, avoiding this cloud machine's unwritable default cache. Package checksum and TLS verification remain enabled.

Access observations are bound to an exact client name. A registry update that changes the client cannot inherit the previous client's cost or allowance. Older checkpoint exports without that field are preserved as unscoped observations and require confirmation before use.

### First useful result

1. On **Find a route**, try the checklist example and click **Find my route**. The included manual text workspace is immediately usable.
2. For your own task, enter text, click **Interpret words**, and review/edit the inferred capabilities and privacy constraints. Interpretation is a keyword baseline, not semantic understanding. Capabilities are ordered by selection and capped at three. Structured edits are authoritative; changing the description alone does not silently overwrite them.
3. Review ready, free-setup, and conditional routes, their reasons, model guidance, integrations, and exclusions. Copy an execution brief or write in the included local draft area.
4. On **Tool inventory**, record actual plan/client access, incremental cost, allowance units and observations, setup/model readiness, and the exact model/settings menu. **Record observation now** is an explicit user attestation. Save hardware separately if a route needs it. No personal access is prefilled for external tools.
5. Use **Evidence library** to inspect sources, retrieve them on demand, and review specific scoped claims. Use **Backup & discovery** for backups and unfamiliar provider imports.

## Decision rules

Hard constraints run before scoring: required capabilities, $0 incremental cost, access, remaining allowance, local privacy/offline needs, OS/model readiness, commercial licensing, and required integrations/automation. Unknown critical facts become conditional; incompatible or over-budget routes are excluded. An installed app does not establish a downloaded, working model. Free setup remains separate until confirmed. Existing subscription access never implies general API credits.

Private tasks require local-only processing. Cloud candidates fail that constraint; unknown local behavior requires verification. This is deliberately conservative. Hardware and account observations are user-reported; cloud checks cannot confirm Mac applications, actual GPU/memory fit, or account menus.

Eligible routes receive a deterministic 0–100 weighted preference score across fit, quality, speed, setup, ease, interoperability, automation, and cost. The UI exposes factors and weights (0–5); an all-zero weighting yields zero scores. No score bypasses a hard constraint. Speed/ease/interoperability are editable heuristics, not measured comparative claims. Quality stays neutral at 2.5/5 without a current benchmark source. Scores are not probabilities.

The first two routes in the best available readiness category form a visible comparison when their score difference is at most the editable threshold (default 7 points). Stable IDs break ordering ties, not substantive decisions. Comparison cards, tradeoffs, conditional “choose if” guidance, and a small test help resolve the choice. No winner is forced.

Model guidance uses only a fresh, user-recorded menu whose client string exactly matches the provider client. It prefers a listed auto/default/standard/medium/balanced setting, otherwise the first reported setting. It does not invent a model menu or automatically maximize reasoning. An unknown menu produces conditional instructions to check it. Menus can include multiple models; the first fresh matching entry is used, so order them deliberately.

For multi-capability tasks, the bounded planner selects at most three stages (one per capability) from non-excluded routes. It checks each stage's cost/privacy requirements and adjacent format overlap; unverifiable format evidence stays conditional. This is a greedy, explainable baseline, not an exhaustive workflow optimizer. Single-tool alternatives appear when viable. Handoffs are manual; even verified component APIs do not establish an automatic cross-tool integration. Shared metered pools aggregate per-run demand using the lowest reported remaining quota, while unknown demand stays conditional. Metered observations expire after 24 hours. Reset timestamps never replenish allowance automatically.

Workflows permit one initial pass with a human quality check. A failed quality check is an escalation trigger, not an automatic retry. Recheck time, model settings, privacy, and shared quota before another pass; stop on a failed constraint. Recommendations do not execute external actions.

## Evidence and discovery

Eight initial tools: the included text workspace, ChatGPT web, Codex CLI, Google Flow, Draw Things macOS, Ollama local, Gemini CLI, and LibreOffice. Source claims and account entitlements are separate. Public records live in `src/data/seed.ts`; fictional fixtures live only in `tests/`.

Official repository documentation for Codex, Draw Things, Ollama, Gemini CLI, and LibreOffice was retrieved and read during implementation. Only the narrow claims supported by those pages have verification dates. Several vendor documentation domains were blocked by the cloud egress policy; their records remain uncertain with null retrieval/verification dates. No exact quota or product-menu values were inferred. Mutable sources use a configurable freshness window (default 30 days); the built-in code claim uses 365 days.

**Refresh source** is an on-demand browser GET with no credentials, task text, or referrer. It has a 10-second timeout, 500 KB response limit, HTTPS URL validation, and rejects redirects. Browser CORS and network policy still apply. A successful response advances only `fetchedAt`; it does not verify the claim. Failed refresh preserves both timestamps and the last-known claim and records the failure. **Review claim** requires an explicit attestation to set a new `verifiedAt`. Changing claim text/source/scope/topics without review clears verification. Imported verification is an assertion from the file, not independent research.

To discover unfamiliar tools, copy the assistant research prompt, research official sources within the $0 constraint, and import a `pick-me-registry` JSON file. The app provides the exact schema and an editable registry export as a template. This source-backed offline/import path works when live retrieval is blocked. Refreshing known sources is not discovery; no scheduled refresh or autonomous web crawler is configured. No Wikipedia is used.

## Local data, validation, and backups

- `localStorage` key: `pick-me.workspace.v1`. Data is specific to the browser profile and origin (scheme, host, port); it is not synced or encrypted. Clearing site data, private browsing cleanup, storage limits, or profile changes can lose it.
- Export deliberately before clearing or moving browsers. Workspace JSON includes task, draft, registry, inventory, and up to 30 recent decisions. History is trimmed oldest-first at a 1.5 MB workspace threshold; current task/inventory/draft are never trimmed by history retention. Larger decisions may remain visible without being retained in history.
- Import is capped at 2 MB, 100 providers, 50 claims per provider, and 30 historical decisions. Strict runtime schemas reject malformed records, unknown fields, unsafe URLs, duplicate IDs, and dangling provider references. Unsupported schema versions produce explicit migration errors; retain the original file and migrate a copy.
- Workspace import previews all providers before replacing local data. Registry import previews additions/updates by stable ID, preserves inventory, and clears historical decisions so current recommendations are recalculated. There is a backup button in the preview and a cancel path.
- Strings render as text via React. Imported HTML/code is never executed, and imported sources are never fetched automatically. No telemetry or background external requests exist. Source refresh and opening source links are deliberate network actions.
- Corrupt stored data is preserved and saving pauses with a recovery/export message. Storage quota failures are visible. If another tab changes the same storage key, saving pauses; export your edits and reload before continuing. **Resume saving this workspace** deliberately replaces the stored version.
- Never put actual exports, credentials, private tasks, personal usage records, or inventories into Git. `.gitignore` excludes common private directories, backups, env files, and generated test outputs. Prefer `private/`, `exports/`, and `backups/` for local files.

## Checks

```sh
npm test                 # deterministic engine/data/storage fixtures
npm run build           # TypeScript checking and production compilation
npm run check           # both of the above
npm run schemas         # regenerate portable JSON Schema documents
npx playwright install chromium
npm run test:browser     # actual Chromium interaction tests
```

If Chromium is already installed (as in the cloud environment):

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
```

The browser test runner starts/stops its own local server. Tests use synthetic data and cover reload persistence, clipboard/copy fallback, inventory edits, preview/cancel/apply import, unsafe content, source refresh and review, comparisons, workflows, private/no-budget routes, keyboard dialogs, and mobile overflow. Browser network responses used in refresh tests are explicitly synthetic test responses. No paid APIs or actual user accounts are involved.

See [docs/VERIFICATION.md](docs/VERIFICATION.md) for executed checks and limits. Cloud Linux Chromium checks do not establish Safari, macOS, VoiceOver, actual local-model performance, vendor feature availability, or account entitlements.

The independent audit and requirements matrix are in [docs/AUDIT.md](docs/AUDIT.md). The [Phase 2 roadmap](docs/ROADMAP.md#phase-2--software-pre-installation-evaluator) records a Software Pre-Installation Evaluator as **PLANNED / NOT IMPLEMENTED**.

Evidence and backup repairs from the audit: conflicting cost claims require verification; conflicting quality claims cannot inflate the score. Editing source/provenance or material provider facts clears the affected verification, and changing a source URL clears its old retrieval metadata. Delayed refresh results update retrieval metadata only and preserve newer drafts, claims, inventory, and tasks. Exports use compact JSON when formatting alone would exceed the 2 MB import limit; no fields are dropped.

## Future local-agent interface

The UI-independent TypeScript API is in `src/core/engine.ts`:

```ts
recommend(task, providers, inventory, hardware, nowIso?): Decision
interpretTask(text): Task
modelGuidance(provider, access, task, nowIso): string
```

All structured inputs pass the same Zod schemas and hard constraints. `nowIso` makes freshness deterministic. A future local interpreter must produce a validated `Task`; a research adapter must produce validated registry records. Neither can bypass eligibility by generating a high score. The engine does not perform I/O or execute tools.

For a CLI adapter, store an exported workspace outside Git and run:

```sh
npm run recommend -- /absolute/path/to/workspace.json
# Reproducible evaluation with an injected clock:
npm run recommend -- /absolute/path/to/workspace.json 2026-10-12T12:00:00.000Z
```

The CLI prints decision JSON to stdout and errors to stderr with a nonzero exit code. Use `npx tsx scripts/recommend.ts ...` when you need stdout without npm's script banner. Output may contain private task text; keep it local. Provider-neutral version-1 JSON Schemas for tasks, providers, evidence, inventory entries, hardware, decisions, stages, registry packs, and workspace backups are in `schemas/`. Runtime validation adds URL safety, uniqueness, and reference checks beyond the JSON Schema documents.

## Repository layout

`src/core/` contains the pure decision/data contracts; `src/data/` contains public seed claims; `src/ui/` contains the screens; `tests/` contains synthetic unit and browser fixtures; `scripts/` contains schema generation and the CLI. `docs/CODEX_BUILD_PROMPT.md` remains the original specification. This MVP uses React, Vite, TypeScript, and Zod, with Vitest and Playwright for validation.
