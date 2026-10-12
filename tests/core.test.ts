import { describe, it, expect } from "vitest";
import { recommend, interpretTask, modelGuidance } from "../src/core/engine";
import {
  parseImport,
  exportWorkspace,
  evidenceStatus,
  refreshEvidence,
} from "../src/core/data";
import { provider, access, task, workspace, NOW } from "./fixtures";
const run = (t = task(), ps = [provider()], inv = [access()]) =>
  recommend(t, ps, inv, workspace().hardware, NOW);
describe("hard constraints before ranking", () => {
  it("keeps private offline tasks local even when a cloud tool scores better", () => {
    const d = run(
      task({ privacy: "private", offline: true }),
      [provider(), provider("cloud", { offline: false })],
      [access(), access("cloud")],
    );
    expect(d.ready.map((r) => r.providerId)).toEqual(["fixture-editor"]);
    expect(
      d.excluded.find((r) => r.providerId === "cloud")?.reasons.join(" "),
    ).toMatch(/local|offline/i);
  });
  it("offers a simple manual route without forcing a model or chain", () => {
    const d = run();
    expect(d.ready).toHaveLength(1);
    expect(d.workflow).toBeNull();
    expect(d.ready[0].guidance).toMatch(/no model/i);
  });
  it("never lets weights override positive cost or a missing capability", () => {
    const d = run(
      task({ capabilities: ["image"] }),
      [provider(), provider("paid", { capabilities: ["image"] })],
      [access(), access("paid", { incrementalCost: 1 })],
    );
    expect(d.ready).toHaveLength(0);
    expect(d.excluded).toHaveLength(2);
    expect(d.nextAction).toBeTruthy();
  });
  it("does not treat unknown or exhausted allowances as ready", () => {
    const unknown = access("unknown", {
      allowance: { ...access().allowance, kind: "unknown" },
    });
    const d = run(
      task({ capabilities: ["video"] }),
      [
        provider("unknown", { capabilities: ["video"] }),
        provider("empty", { capabilities: ["video"] }),
      ],
      [unknown, access("empty", { status: "exhausted" })],
    );
    expect(d.ready).toHaveLength(0);
    expect(d.conditional).toHaveLength(1);
    expect(d.excluded).toHaveLength(1);
  });
  it.each(["uncertain", "conflicting", "stale"] as const)(
    "keeps %s critical evidence conditional",
    (status) => {
      const p = provider();
      p.evidence[0].status = status;
      expect(run(task(), [p]).ready).toHaveLength(0);
      expect(run(task(), [p]).conditional).toHaveLength(1);
    },
  );
  it("requires local model readiness and hardware confirmation even if installed", () => {
    const p = provider("local-ai", { kind: "ai", requiresModel: true });
    expect(
      run(task(), [p], [access("local-ai", { hardwareConfirmed: false })])
        .conditional,
    ).toHaveLength(1);
  });
  it("keeps a verified free installation in its own setup bucket", () => {
    const d = run(
      task(),
      [provider()],
      [
        access("fixture-editor", {
          status: "free-setup",
          installed: false,
          setupConfirmed: false,
        }),
      ],
    );
    expect(d.setup).toHaveLength(1);
    expect(d.ready).toHaveLength(0);
  });
  it("blocks unknown, unsupported, and conflicting commercial use", () => {
    const p = provider();
    p.commercial = null;
    p.evidence[0].status = "conflicting";
    expect(run(task({ commercial: true }), [p], [access()]).ready).toHaveLength(
      0,
    );
    expect(
      run(
        task({ commercial: true }),
        [provider("no-license", { commercial: false })],
        [access("no-license")],
      ).excluded,
    ).toHaveLength(1);
    expect(
      run(
        task({ commercial: true }),
        [provider("unknown-license", { commercial: null })],
        [access("unknown-license", { licenseConfirmed: false })],
      ).conditional,
    ).toHaveLength(1);
  });
  it("requires verified programmable support when automation is mandatory", () => {
    expect(run(task({ automation: "required" })).ready).toHaveLength(0);
  });
  it("does not revive expired access or a quota because the reset time passed", () => {
    const a = access();
    a.checkedAt = "2026-01-01T00:00:00Z";
    expect(run(task(), [provider()], [a]).conditional).toHaveLength(1);
    a.status = "exhausted";
    a.allowance.resetsAt = "2026-10-11T00:00:00Z";
    expect(run(task(), [provider()], [a]).excluded).toHaveLength(1);
  });
  it("keeps maximum-size valid task fields usable through decision output", () => {
    const t = task({
      text: "a".repeat(20000),
      inputs: "b".repeat(20000),
      successCriteria: "c".repeat(20000),
    });
    expect(run(t).ready[0].prompt).toContain("c".repeat(20000));
  });
  it("shows two comparable routes without forcing a winner", () => {
    const d = run(
      task(),
      [provider("a"), provider("b")],
      [access("a"), access("b")],
    );
    expect(d.comparison?.providerIds).toEqual(["a", "b"]);
    expect(d.comparison?.test).toBeTruthy();
  });
  it("only names a model and setting from the exact current client menu", () => {
    const p = provider("ai", { kind: "ai" });
    const a = access("ai");
    a.menus = [
      {
        client: "Other client",
        model: "Fictional-1",
        settings: ["standard", "deep"],
        checkedAt: NOW,
      },
    ];
    expect(modelGuidance(p, a, task(), NOW)).not.toContain("Fictional-1");
    a.menus[0].client = p.client;
    expect(modelGuidance(p, a, task(), NOW)).toContain("standard");
    expect(modelGuidance(p, a, task(), NOW)).not.toContain("Use deep");
  });
  it("interprets task keywords honestly and permits explicit edits", () => {
    expect(interpretTask("Create an image and a video").capabilities).toEqual([
      "image",
      "video",
    ]);
    expect(interpretTask("Organize private notes offline").offline).toBe(true);
  });
});
describe("bounded workflows", () => {
  const ps = [
    provider("writer"),
    provider("image", { capabilities: ["image"] }),
  ];
  it('handles maximum format metadata without crashing a valid task', () => {
    const first = provider('writer', { outputs: ['text/plain', ...Array.from({ length: 19 }, (_, i) => `${i}-`.padEnd(100, 'x'))] });
    expect(() => run(task({ capabilities: ['writing', 'image'] }), [first, ps[1]], [access('writer'), access('image')])).not.toThrow();
  });
  it('does not let a verified formats claim hide a conflicting claim', () => {
    const first = provider('writer'); first.evidence.push({ ...first.evidence[0], id: 'format-conflict', topics: ['formats'], status: 'conflicting' });
    expect(run(task({ capabilities: ['writing', 'image'] }), [first, ps[1]], [access('writer'), access('image')]).workflow?.status).toBe('conditional');
  });
  it("builds two cost-checked stages with compatible handoffs", () => {
    const d = run(task({ capabilities: ["writing", "image"] }), ps, [
      access("writer"),
      access("image"),
    ]);
    expect(d.workflow?.status).toBe("ready");
    expect(d.workflow?.stages).toHaveLength(2);
    expect(d.workflow?.stages.every((s) => s.incrementalCost === 0)).toBe(true);
    expect(d.workflow?.iterations).toBe(1);
  });
  it("aggregates a shared measured allowance and blocks overdraw", () => {
    const inv = ["writer", "image"].map((id) =>
      access(id, {
        allowance: {
          kind: "metered",
          remaining: 1,
          perRun: 1,
          unit: "credits",
          poolId: "shared",
          checkedAt: NOW,
          resetsAt: null,
        },
      }),
    );
    const d = run(task({ capabilities: ["writing", "image"] }), ps, inv);
    expect(d.workflow?.status).toBe("excluded");
    expect(d.workflow?.notes.join(" ")).toMatch(/shared|allowance/i);
  });
  it("marks unmeasured consumption conditional and rejects incompatible handoffs", () => {
    const inv = ["writer", "image"].map((id) =>
      access(id, {
        allowance: {
          ...access().allowance,
          kind: "metered",
          remaining: 10,
          perRun: null,
        },
      }),
    );
    expect(
      run(task({ capabilities: ["writing", "image"] }), ps, inv).workflow
        ?.status,
    ).toBe("conditional");
    const bad = [
      ps[0],
      provider("image", { capabilities: ["image"], inputs: ["image/png"] }),
    ];
    expect(
      run(task({ capabilities: ["writing", "image"] }), bad, [
        access("writer"),
        access("image"),
      ]).workflow?.status,
    ).toBe("excluded");
  });
  it("never returns a ready chain that leaks a private task to cloud", () => {
    const d = run(
      task({
        capabilities: ["writing", "image"],
        privacy: "private",
        offline: true,
      }),
      [ps[0], provider("image", { capabilities: ["image"], offline: false })],
      [access("writer"), access("image")],
    );
    expect(d.workflow).toBeNull();
  });
  it("honors the stage bound", () => {
    expect(
      run(task({ capabilities: ["writing", "image"], maxStages: 1 }), ps, [
        access("writer"),
        access("image"),
      ]).workflow,
    ).toBeNull();
  });
});
describe("portable, untrusted data and dated evidence", () => {
  it("round trips a workspace and imports an unfamiliar provider", () => {
    const w = workspace();
    expect(parseImport(exportWorkspace(w))).toEqual(w);
    const pack = {
      schemaVersion: 1,
      kind: "pick-me-registry",
      providers: [provider("unfamiliar")],
    };
    expect(parseImport(JSON.stringify(pack)).providers[0].id).toBe(
      "unfamiliar",
    );
  });
  it.each([
    '{"schemaVersion":99}',
    "{}",
    "{bad json}",
    JSON.stringify({
      ...workspace(),
      providers: [
        {
          ...provider(),
          evidence: [{ ...provider().evidence[0], url: "javascript:alert(1)" }],
        },
      ],
    }),
  ])("rejects malformed or unsafe imports", (raw) => {
    expect(() => parseImport(raw)).toThrow();
  });
  it("rejects oversize and duplicate records", () => {
    expect(() => parseImport(" ".repeat(2_000_001))).toThrow(/size|large/i);
    expect(() =>
      parseImport(
        JSON.stringify({ ...workspace(), providers: [provider(), provider()] }),
      ),
    ).toThrow(/duplicate/i);
  });
  it("computes stale evidence with an injected clock", () => {
    const e = provider().evidence[0];
    expect(evidenceStatus(e, "2027-01-01T00:00:00Z")).toBe("stale");
    e.verifiedAt = null;
    expect(evidenceStatus(e, NOW)).toBe("uncertain");
  });
  it("preserves last-known claims and dates after failed refresh", async () => {
    const e = provider().evidence[0];
    const updated = await refreshEvidence(
      e,
      async () => {
        throw new Error("CORS blocked");
      },
      NOW,
    );
    expect(updated.claim).toBe(e.claim);
    expect(updated.verifiedAt).toBe(e.verifiedAt);
    expect(updated.fetchedAt).toBe(e.fetchedAt);
    expect(updated.lastError).toContain("CORS");
  });
  it("records retrieval without falsely advancing verification", async () => {
    const e = provider().evidence[0];
    const later = "2026-10-13T00:00:00Z";
    const updated = await refreshEvidence(
      e,
      async () => new Response("official page"),
      later,
    );
    expect(updated.fetchedAt).toBe(later);
    expect(updated.verifiedAt).toBe(e.verifiedAt);
  });
});
