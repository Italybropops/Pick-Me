# Pick-Me development

- Read README.md and docs/CODEX_BUILD_PROMPT.md before changing behavior.
- Keep recommendation logic in src/core independent of React, storage, network, and model APIs. Validate every adapter/import with the same schemas and hard constraints.
- $0 additional spend; no paid APIs, credentials, purchases, telemetry, deployment, or merge without explicit authorization.
- Preserve the separation between public provider claims and personal access. Unknown critical facts never produce a ready route. Evidence retrieval is not claim verification.
- Commit only code, public evidence, and clearly synthetic fixtures. User inventories, tasks, exports, and account details belong outside Git.
- Use the existing isolated checkout. Do not create worktrees unless the user requests one. Implement on a separate feature branch.
- Run npm run check after behavior changes. Run npm run test:browser for UI changes; use PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium in this cloud machine. Regenerate schemas with npm run schemas after schema edits.
- Keep tests meaningful: hard constraints must survive weighting changes, each workflow stage must preserve cost/privacy, timestamps must retain their meanings, and imports must remain inert and reversible until confirmation.
