import {
  AccessSchema,
  DecisionSchema,
  HardwareSchema,
  ProviderSchema,
  TaskSchema,
  type Task,
  type Provider,
  type Access,
  type Hardware,
  type Route,
  type Decision,
  type Stage,
} from "./schema";
import { evidenceStatus, fresh } from "./data";

export const defaultWeights: Task["weights"] = {
  fit: 5,
  quality: 3,
  speed: 3,
  setup: 3,
  ease: 4,
  interoperability: 2,
  automation: 1,
  cost: 5,
};
export function interpretTask(text: string): Task {
  const checks: [Task["capabilities"][number], RegExp][] = [
    ["writing", /\b(write|draft|article|email|story|script|copy)\b/i],
    ["organization", /\b(organize|list|checklist|notes|sort|plan)\b/i],
    ["coding", /\b(code|coding|app|website|debug|software|function)\b/i],
    ["research", /\b(research|sources|citations|investigate|compare)\b/i],
    ["image", /\b(image|picture|illustration|logo|poster|photo)\b/i],
    ["video", /\b(video|film|animation|clip)\b/i],
  ];
  const found = checks.filter(([, re]) => re.test(text)).map(([c]) => c);
  return {
    schemaVersion: 1,
    id: "current-task",
    text,
    capabilities: (found.length ? found : ["writing"]).slice(
      0,
      3,
    ) as Task["capabilities"],
    desiredOutput: "",
    successCriteria: "",
    inputs: "",
    deadline: "",
    privacy: /\b(private|confidential|sensitive)\b/i.test(text)
      ? "private"
      : "public",
    offline: /\boffline\b/i.test(text),
    commercial: /\b(commercial|client|sell)\b/i.test(text),
    automation: "manual",
    weights: { ...defaultWeights },
    tieThreshold: 7,
    maxStages: 3,
  };
}
export function modelGuidance(
  p: Provider,
  a: Access | undefined,
  t: Task,
  now: string,
): string {
  if (p.kind === "manual")
    return "No model or reasoning setting needed. Complete the task manually and review against your success criteria.";
  const menu = a?.menus.find(
    (m) => m.client === p.client && fresh(m.checkedAt, a.freshnessDays, now),
  );
  if (!menu)
    return `Model menu unknown for ${p.client}. Check the exact client’s available model and reasoning controls in Inventory; do not borrow settings from another interface.`;
  const preferred =
    menu.settings.find((s) =>
      /^(auto|default|standard|medium|balanced)$/i.test(s),
    ) ?? menu.settings[0];
  return `${menu.model} in ${p.client} — use ${preferred} (user-reported menu). Start with one pass. Increase reasoning only if a concrete quality check fails and the exact menu and remaining allowance permit it.`;
}
function prompt(t: Task, p: Provider): string {
  return `Task: ${t.text}\nRequired output: ${t.desiredOutput || t.capabilities.join(", ")}\nSuccess criteria: ${t.successCriteria || "Accurate, usable, and proportionate to the task."}\nInputs/references: ${t.inputs || "Use only the supplied material; flag missing inputs."}\nDeadline: ${t.deadline || "Not specified"}\nTool/client: ${p.name} / ${p.client}\nConstraints: $0 additional spending. ${t.offline || t.privacy === "private" ? "Keep all data local; no network tools or external uploads." : "No paid APIs, paid credits, purchases, or payment-required trials."}\n${t.commercial ? "Confirm model, asset, and output licenses for commercial use." : ""}\nProduce one initial pass, then check it against the success criteria. Flag uncertainties. Stop before extra paid work or unverified integrations. Do not automatically execute external actions.`;
}
function evaluate(
  t: Task,
  p: Provider,
  observation: Access | undefined,
  h: Hardware,
  now: string,
): Route {
  const a = observation?.client === p.client ? observation : undefined;
  const fail: string[] = [],
    missing: string[] = [],
    notes: string[] = [];
  if (observation && !a)
    missing.push(
      `Access was observed in ${observation.client}, not ${p.client}. Confirm this client's access, cost, and allowance in Inventory.`,
    );
  const evidence = (topic: Provider["evidence"][number]["topics"][number]) => {
    const claims = p.evidence.filter((e) => e.topics.includes(topic));
    if (
      !claims.length ||
      claims.some((e) => evidenceStatus(e, now) !== "verified")
    )
      missing.push(
        `Verify ${topic} evidence for ${p.client}; unknown, stale, or conflicting claims cannot pass.`,
      );
  };
  if (!t.capabilities.every((c) => p.capabilities.includes(c)))
    fail.push(
      `Missing required capability: ${t.capabilities.filter((c) => !p.capabilities.includes(c)).join(", ")}.`,
    );
  evidence("capabilities");
  if (
    a?.status === "paid" ||
    (a?.incrementalCost !== null &&
      a?.incrementalCost !== undefined &&
      a.incrementalCost > 0)
  )
    fail.push("Additional spending exceeds the $0 budget.");
  if (
    a?.status === "exhausted" ||
    (a?.allowance.kind === "metered" && a.allowance.remaining === 0)
  )
    fail.push("Allowance exhausted. Confirm a reset or choose another route.");
  if (!a)
    missing.push(
      "Add your access, cost, and allowance observations in Inventory.",
    );
  else {
    if (a.status === "unverified" || a.status === "uncertain")
      missing.push("Access is not confirmed.");
    if (!fresh(a.checkedAt, a.freshnessDays, now))
      missing.push("Access/cost observation is missing or stale.");
    if (a.incrementalCost === null)
      missing.push(
        "Confirm $0 incremental cost for this exact plan and client.",
      );
    if (a.allowance.kind === "unknown")
      missing.push("Allowance is unknown; a subscription is not API credit.");
    if (
      !fresh(
        a.allowance.checkedAt,
        a.allowance.kind === "metered" ? 1 : a.freshnessDays,
        now,
      )
    )
      missing.push(
        "Check the current allowance; reset dates do not automatically restore it.",
      );
    if (a.allowance.kind === "metered") {
      if (a.allowance.remaining === null || a.allowance.perRun === null)
        missing.push(
          "Measure remaining allowance and per-run demand before use.",
        );
      else if (a.allowance.remaining < a.allowance.perRun)
        fail.push("Not enough allowance for one pass.");
    }
    if (a.status === "free-setup") {
      if (p.zeroCost !== true)
        missing.push("Verify that setup itself is free.");
      evidence("cost");
    } else if (!a.setupConfirmed)
      missing.push("Complete and confirm the client setup.");
    if (p.requiresModel && !a.modelsReady && a.status !== "free-setup")
      missing.push(
        "Installed does not mean a model is downloaded and working. Confirm model readiness.",
      );
    if (p.requiresModel && !a.hardwareConfirmed)
      missing.push(
        "Confirm the selected model fits your hardware; cloud cannot inspect your Mac.",
      );
  }
  if (!p.os.includes("any")) {
    if (h.os === "unknown" || !fresh(h.checkedAt, 365, now))
      missing.push("Confirm your operating system and hardware observation.");
    else if (!p.os.includes(h.os))
      fail.push("The selected client does not support your operating system.");
  }
  if (t.offline || t.privacy === "private") {
    if (p.offline === false)
      fail.push(
        "This task requires local/offline processing; cloud submission is excluded.",
      );
    else if (p.offline === null)
      missing.push("Offline/privacy behavior is unknown.");
    evidence("offline");
    if (!a?.localVerified)
      missing.push(
        "Verify local-only operation with downloads complete and network features off.",
      );
  }
  if (t.commercial) {
    if (p.commercial === false)
      fail.push("Commercial use is not permitted for this route.");
    else if (p.commercial === null && !a?.licenseConfirmed)
      missing.push(
        "Verify the exact model and output license for commercial use.",
      );
    if (
      p.commercial === true ||
      p.evidence.some((e) => e.topics.includes("commercial"))
    )
      evidence("commercial");
    if (!a?.licenseConfirmed)
      missing.push("Confirm your model, asset, and output licensing.");
  }
  if (t.automation === "required") {
    if (!a?.automationVerified)
      missing.push(
        "Programmable integration is not verified for this client. Manual handoff is insufficient.",
      );
    evidence("automation");
  }
  for (const i of p.integrations.filter((i) => i.role === "required")) {
    if (i.cost !== null && i.cost > 0)
      fail.push(`Required integration ${i.name} exceeds the $0 budget.`);
    if (i.support !== "verified" || i.cost === null)
      missing.push(
        `Confirm destination support and cost for required integration ${i.name}.`,
      );
    if (t.offline || t.privacy === "private")
      missing.push(
        `Verify required integration ${i.name} preserves local privacy.`,
      );
  }
  const qualityKnown =
    p.ratings.quality !== null &&
    p.evidence.some(
      (e) =>
        e.topics.includes("quality") &&
        e.sourceType === "benchmark" &&
        evidenceStatus(e, now) === "verified",
    );
  const factors: Route["factors"] = {
    fit: t.capabilities.every((c) => p.capabilities.includes(c)) ? 5 : 0,
    quality: qualityKnown ? p.ratings.quality! : 2.5,
    speed: p.ratings.speed,
    setup: a?.status === "ready" && a.setupConfirmed ? 5 : 1,
    ease: p.ratings.ease,
    interoperability: p.ratings.interoperability,
    automation: a?.automationVerified ? p.ratings.automation : 0,
    cost: a?.incrementalCost === 0 ? 5 : 0,
  };
  const total = Object.values(t.weights).reduce((sum, w) => sum + w, 0);
  const score = total
    ? Math.round(
        (Object.entries(t.weights).reduce(
          (sum, [key, w]) => sum + factors[key] * w,
          0,
        ) /
          (total * 5)) *
          100,
      )
    : 0;
  notes.push(
    "Score is a transparent preference heuristic, not a probability or a benchmark.",
  );
  if (!qualityKnown)
    notes.push(
      "No current comparative quality benchmark: neutral quality score.",
    );
  const status = fail.length
    ? "excluded"
    : missing.length
      ? "conditional"
      : a?.status === "free-setup"
        ? "setup"
        : "ready";
  return {
    providerId: p.id,
    status,
    score,
    reasons: [...fail, ...missing, ...notes],
    factors,
    guidance: modelGuidance(p, a, t, now),
    prompt: prompt(t, p),
    evidenceIds: p.evidence.map((e) => e.id),
  };
}
export function recommend(
  task: Task,
  providers: Provider[],
  inventory: Access[],
  hardware: Hardware,
  now = new Date().toISOString(),
): Decision {
  const t = TaskSchema.parse(task),
    h = HardwareSchema.parse(hardware);
  if (!Number.isFinite(Date.parse(now)))
    throw new Error("Invalid decision clock.");
  const ps = providers.map((p) => ProviderSchema.parse(p));
  const inv = inventory.map((a) => AccessSchema.parse(a));
  if (
    new Set(ps.map((p) => p.id)).size !== ps.length ||
    new Set(inv.map((a) => a.providerId)).size !== inv.length
  )
    throw new Error("Duplicate provider or inventory IDs.");
  const routes = ps
    .map((p) =>
      evaluate(
        t,
        p,
        inv.find((a) => a.providerId === p.id),
        h,
        now,
      ),
    )
    .sort(
      (a, b) => b.score - a.score || a.providerId.localeCompare(b.providerId),
    );
  const bucket = (status: Route["status"]) =>
    routes.filter((r) => r.status === status);
  const ready = bucket("ready"),
    setup = bucket("setup"),
    conditional = bucket("conditional"),
    excluded = bucket("excluded");
  const choices = ready.length ? ready : setup.length ? setup : conditional;
  const close =
    choices.length >= 2 &&
    choices[0].score - choices[1].score <= t.tieThreshold;
  let workflow: Decision["workflow"] = null;
  if (t.capabilities.length > 1 && t.maxStages >= t.capabilities.length) {
    const stages: Stage[] = [];
    const selected: Access[] = [];
    const notes: string[] = [];
    const order = { ready: 0, setup: 1, conditional: 2, excluded: 3 };
    for (const [index, capability] of t.capabilities.entries()) {
      const options = ps
        .filter((p) => p.capabilities.includes(capability))
        .map((p) => ({
          p,
          a: inv.find((a) => a.providerId === p.id && a.client === p.client),
          r: evaluate(
            { ...t, capabilities: [capability] },
            p,
            inv.find((a) => a.providerId === p.id),
            h,
            now,
          ),
        }))
        .filter((o) => o.r.status !== "excluded")
        .sort(
          (a, b) =>
            order[a.r.status] - order[b.r.status] ||
            b.r.score - a.r.score ||
            a.p.id.localeCompare(b.p.id),
        );
      const o = options[0];
      if (!o) break;
      if (o.a) selected.push(o.a);
      let handoff = "text/plain";
      if (index > 0) {
        const previous = ps.find((p) => p.id === stages[index - 1].providerId)!;
        const match = previous.outputs.find((f) => o.p.inputs.includes(f));
        handoff = match ?? "Incompatible formats";
        if (!match)
          notes.push(
            `No compatible handoff from ${previous.name} to ${o.p.name}.`,
          );
        if (
          [previous, o.p].some((p) => {
            const claims = p.evidence.filter((e) =>
              e.topics.includes("formats"),
            );
            return (
              !claims.length ||
              claims.some((e) => evidenceStatus(e, now) !== "verified")
            );
          })
        )
          notes.push("Handoff formats need source verification.");
      }
      stages.push({
        schemaVersion: 1,
        id: `stage-${index + 1}`,
        providerId: o.p.id,
        capability,
        input: index
          ? "Previous stage output plus original success criteria"
          : t.inputs.slice(0, 500) || "Task brief and supplied references",
        output: `${capability} deliverable (${o.p.outputs.join(", ")})`,
        handoff,
        prerequisites: o.r.reasons,
        completionCheck: `Check ${capability} output against ${t.successCriteria.slice(0, 200) || "the task brief, factual accuracy, and requested format"}.`,
        guidance: o.r.guidance,
        incrementalCost: o.a?.incrementalCost ?? null,
        status: o.r.status,
      });
    }
    if (
      stages.length === t.capabilities.length &&
      new Set(stages.map((s) => s.providerId)).size > 1
    ) {
      let status: Route["status"] = stages.some(
        (s) => s.status === "conditional",
      )
        ? "conditional"
        : stages.some((s) => s.status === "setup")
          ? "setup"
          : "ready";
      for (const pool of new Set(selected.map((a) => a.allowance.poolId))) {
        const members = selected.filter((a) => a.allowance.poolId === pool);
        const metered = members.filter((a) => a.allowance.kind === "metered");
        if (!metered.length) continue;
        if (
          metered.length !== members.length ||
          new Set(metered.map((a) => a.allowance.unit)).size > 1
        ) {
          status = "conditional";
          notes.push(
            `Shared allowance ${pool} has inconsistent units or observations.`,
          );
          continue;
        }
        if (
          metered.some(
            (a) =>
              a.allowance.perRun === null || a.allowance.remaining === null,
          )
        ) {
          if (status !== "excluded") status = "conditional";
          notes.push(
            `Shared allowance ${pool}: total consumption unknown; verify before any stage.`,
          );
        } else {
          const demand = metered.reduce(
              (sum, a) => sum + a.allowance.perRun!,
              0,
            ),
            remaining = Math.min(...metered.map((a) => a.allowance.remaining!));
          notes.push(
            `Shared allowance ${pool}: ${demand} ${metered[0].allowance.unit} required, ${remaining} available; one pass only.`,
          );
          if (demand > remaining) {
            status = "excluded";
            notes.push("Shared allowance cannot cover all stages.");
          }
        }
      }
      if (notes.some((n) => n.includes("No compatible"))) status = "excluded";
      else if (
        notes.some((n) => n.includes("source verification")) &&
        status !== "excluded"
      )
        status = "conditional";
      notes.push(
        t.automation === "required"
          ? "Verify orchestration separately: this app does not execute integrations."
          : "Manual handoff: copy/export between tools; programmable integration is not assumed.",
      );
      if (t.automation === "required" && status !== "excluded")
        status = "conditional";
      workflow = {
        status,
        stages,
        notes,
        iterations: 1,
        qualityCheck:
          "After the initial pass, review each output locally against the success criteria and inspect the handoff format.",
        escalation:
          "Escalate only for a specific failed check. Recheck menus, evidence, time, and the whole shared allowance before a new run.",
        stop: "Stop after one pass or immediately on a cost, privacy, format, or allowance failure.",
        extraCost:
          "No automatic retries. An extra pass adds unknown time and quota; $0 must be reverified first.",
      };
    }
  }
  const nextAction = ready.length
    ? `Start with ${ps.find((p) => p.id === ready[0].providerId)!.name}; ${close ? "compare the two close options below first." : "copy the execution brief and complete one pass."}`
    : workflow?.status === "ready"
      ? "Use the numbered workflow below; all stages must keep the same $0 and privacy constraints."
      : setup.length
        ? `Complete free setup for ${ps.find((p) => p.id === setup[0].providerId)!.name}, then confirm readiness in Inventory.`
        : conditional.length
          ? `No confirmed $0 route yet. Smallest next step: ${conditional[0].reasons[0]}`
          : "No eligible $0 route. Add a verified free tool with the required capability or deliberately narrow the task; do not purchase access.";
  return DecisionSchema.parse({
    schemaVersion: 1,
    id: `decision-${Date.parse(now)}`,
    taskId: t.id,
    createdAt: now,
    ready,
    setup,
    conditional,
    excluded,
    comparison: close
      ? {
          providerIds: [choices[0].providerId, choices[1].providerId],
          difference: choices[0].score - choices[1].score,
          threshold: t.tieThreshold,
          test: "Try the same small synthetic sample in each eligible tool. Compare usable output, elapsed time, and measured quota. Stop if a prerequisite fails.",
        }
      : null,
    workflow,
    nextAction,
  });
}
