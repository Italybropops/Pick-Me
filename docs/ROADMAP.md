# Pick-Me roadmap

## Phase 2 — Software Pre-Installation Evaluator

**Status: PLANNED / NOT IMPLEMENTED.** This entry is a proposal only. No evaluator code, prototype, dependency, installer, or background process has been added by the MVP audit.

Before installing a proposed application or local model, evaluate whether it is necessary, compatible with the user's Mac, affordable within the $0 additional-spend constraint, and acceptable for privacy/security. Compare existing installed alternatives and overlapping functionality, and give a source-backed recommendation with explicit unknowns.

### Expected inputs

- Candidate software/model, intended task, exact version/client, official source and license, and dated requirements/pricing evidence.
- User-confirmed Mac model, macOS version, CPU architecture, GPU/Metal support, RAM/unified memory, available storage, download size, and other needed runtime/resources. User reports remain marked as such; cloud inspection cannot confirm local hardware.
- Existing installed software and working models, capabilities, access plans, included allowances, and overlapping functions.
- Privacy/offline needs, allowed transmission destinations, permissions/security constraints, commercial-use requirements, available time, and the $0 incremental budget.

### Expected outputs

- Compatibility/resource assessment covering CPU, GPU, RAM, storage, macOS, runtime dependencies, and model-specific limits, with sources and checked dates or unknowns.
- Privacy and security assessment: what data leaves the machine, destinations, account requirements, permissions, software provenance/signatures, and relevant documented risks.
- Initial and ongoing cost assessment, including downloads/setup, subscriptions, credits/APIs, optional paid integrations, trials, and recurring obligations. Existing access is separate from new spending.
- Comparison with already-installed alternatives and whether installation is necessary at all.
- A practical recommendation: use an existing tool, install through verified free setup, verify missing facts first, or avoid the installation, with decisive reasons and one next action. No automatic installation or spending.

### Proposed acceptance criteria

1. A CPU/OS incompatibility or insufficient confirmed resources prevents an “install now” recommendation; unknown resource facts produce a verification prerequisite.
2. Required transmission or permissions that violate the user's privacy/security constraints prevent approval; unknown behavior stays conditional.
3. Any required additional cost exceeds the $0 budget and excludes that route. Included allowances need explicit, dated observations; free/payment-required trials must not be conflated.
4. A working installed alternative that satisfies the task is offered before recommending an unnecessary download or duplicate application.
5. Each material mutable compatibility, privacy, security, license, or cost claim carries specific scope, a source, freshness policy, and actual verification time or null. Retrieval alone never establishes verification.
6. The evaluation is exportable and explainable, retains provenance, and requires explicit user action before installation. It does not silently install software, enable services, transmit private inventory, or invoke paid APIs.

Implementation requires a future, separately authorized task. The current MVP only records inventory/hardware observations and applies its existing recommendation constraints.
