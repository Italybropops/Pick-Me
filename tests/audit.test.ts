import { describe, expect, it } from "vitest";
import {
  exportWorkspace,
  parseImport,
  MAX_BYTES,
  reviseEvidence,
  reviseProvider,
  applyEvidenceRefresh,
} from "../src/core/data";
import { recommend } from "../src/core/engine";
import { provider, access, task, workspace, NOW } from "./fixtures";

describe("independent audit regressions", () => {
  it("exports a valid compact import even when formatted output exceeds 2 MB", () => {
    const w = workspace();
    w.providers = Array.from({ length: 40 }, (_, i) => {
      const p = provider(`p${i}`);
      p.evidence = Array.from({ length: 50 }, (_, j) => ({
        ...p.evidence[0],
        id: `p${i}-e${j}`,
        claim: "x".repeat(400),
      }));
      return p;
    });
    w.inventory = [];
    const compact = JSON.stringify(w);
    expect(Buffer.byteLength(compact)).toBeLessThan(MAX_BYTES);
    expect(Buffer.byteLength(JSON.stringify(w, null, 2))).toBeGreaterThan(
      MAX_BYTES,
    );
    const loaded = parseImport(compact);
    if (loaded.kind !== "pick-me-workspace")
      throw new Error("Expected workspace");
    const exported = exportWorkspace(loaded);
    expect(Buffer.byteLength(exported)).toBeLessThanOrEqual(MAX_BYTES);
    expect(parseImport(exported)).toEqual(w);
  });
  it("does not treat contradictory cost evidence as a confirmed zero-dollar route", () => {
    const p = provider();
    p.evidence[0].topics = ["capabilities"];
    p.evidence.push({
      ...p.evidence[0],
      id: "cost-conflict",
      topics: ["cost"],
      status: "conflicting",
    });
    const d = recommend(task(), [p], [access()], workspace().hardware, NOW);
    expect(d.ready).toHaveLength(0);
    expect(d.conditional[0].reasons.join(" ")).toMatch(/cost.*evidence/i);
  });
  it("keeps quality neutral when a benchmark has contradictory quality evidence", () => {
    const p = provider();
    p.ratings.quality = 5;
    p.evidence.push({
      ...p.evidence[0],
      id: "quality-benchmark",
      topics: ["quality"],
      sourceType: "benchmark",
    });
    p.evidence.push({
      ...p.evidence[0],
      id: "quality-conflict",
      topics: ["quality"],
      status: "conflicting",
    });
    const d = recommend(task(), [p], [access()], workspace().hardware, NOW);
    expect(d.ready[0].factors.quality).toBe(2.5);
  });
  it("requires explicit review to promote a conflicting claim", () => {
    const original = {
      ...provider().evidence[0],
      status: "conflicting" as const,
    };
    const draft = { ...original, status: "verified" as const };
    expect(reviseEvidence(original, draft).status).toBe("conflicting");
    const reviewed = reviseEvidence(
      original,
      draft,
      true,
      "2026-10-12T13:00:00.000Z",
    );
    expect(reviewed.status).toBe("verified");
    expect(reviewed.verifiedAt).toBe("2026-10-12T13:00:00.000Z");
    expect(reviewed.fetchedAt).toBe(original.fetchedAt);
  });
  it("invalidates capability evidence when editable provider facts change", () => {
    const original = provider();
    const draft = {
      ...original,
      capabilities: ["image"] as typeof original.capabilities,
    };
    const revised = reviseProvider(original, draft);
    expect(revised.evidence[0].verifiedAt).toBeNull();
    expect(revised.evidence[0].status).toBe("uncertain");
    expect(
      recommend(
        task({ capabilities: ["image"] }),
        [revised],
        [access()],
        workspace().hardware,
        NOW,
      ).ready,
    ).toHaveLength(0);
  });
  it("preserves explicit conflicts while invalidating changed provider facts", () => {
    const original = provider();
    original.evidence[0].status = "conflicting";
    expect(
      reviseProvider(original, { ...original, zeroCost: false }).evidence[0]
        .status,
    ).toBe("conflicting");
  });
  it("merges only retrieval metadata and preserves a newer claim and private draft", () => {
    const original = provider().evidence[0],
      w = workspace();
    w.scratchpad = "Synthetic private draft";
    w.providers[0].evidence[0] = {
      ...original,
      claim: "A newly reviewed synthetic claim",
      verifiedAt: "2026-10-12T13:00:00.000Z",
    };
    const result = applyEvidenceRefresh(w, w.providers[0].id, original, {
      ...original,
      fetchedAt: "2026-10-12T14:00:00.000Z",
    });
    expect(result.scratchpad).toBe(w.scratchpad);
    expect(result.providers[0].evidence[0].claim).toBe(
      w.providers[0].evidence[0].claim,
    );
    expect(result.providers[0].evidence[0].verifiedAt).toBe(
      w.providers[0].evidence[0].verifiedAt,
    );
    expect(result.providers[0].evidence[0].fetchedAt).toBe(
      "2026-10-12T14:00:00.000Z",
    );
  });
  it("ignores an in-flight result when its source URL has since changed", () => {
    const original = provider().evidence[0],
      w = workspace();
    w.providers[0].evidence[0].url = "https://example.com/new-source";
    expect(
      applyEvidenceRefresh(w, w.providers[0].id, original, {
        ...original,
        fetchedAt: "2026-10-12T14:00:00.000Z",
      }),
    ).toEqual(w);
  });
  it("preserves the latest retrieval on a late failure or older successful response", () => {
    const original = provider().evidence[0],
      w = workspace();
    w.providers[0].evidence[0].fetchedAt = "2026-10-12T15:00:00.000Z";
    for (const lastError of [null, "Refresh failed: synthetic CORS error"]) {
      const result = applyEvidenceRefresh(w, w.providers[0].id, original, {
        ...original,
        fetchedAt: "2026-10-12T14:00:00.000Z",
        lastError,
      });
      expect(result.providers[0].evidence[0].fetchedAt).toBe(
        "2026-10-12T15:00:00.000Z",
      );
    }
  });
});
