import { it, expect } from "vitest";
import {
  loadWorkspace,
  saveWorkspace,
  recordDecision,
  STORAGE_KEY,
} from "../src/core/storage";
import { workspace } from "./fixtures";
import { initialWorkspace } from "../src/data/seed";
import { recommend } from "../src/core/engine";
import { parseImport, mergeRegistry } from "../src/core/data";
import { provider, access, task, NOW } from "./fixtures";
it("preserves a corrupt original and pauses saving", () => {
  const original = "{bad";
  const result = loadWorkspace({ getItem: () => original });
  expect(result.error).toContain("preserved");
  expect(result.data.kind).toBe("pick-me-workspace");
});
it("surfaces quota failure and round trips local persistence", () => {
  expect(
    saveWorkspace(
      {
        setItem: () => {
          throw new Error("full");
        },
      },
      workspace(),
    ),
  ).toContain("export a backup");
  const memory = new Map<string, string>();
  expect(
    saveWorkspace(
      {
        setItem: (k, v) => {
          memory.set(k, v);
        },
      },
      workspace(),
    ),
  ).toBeNull();
  expect(loadWorkspace({ getItem: (k) => memory.get(k) ?? null }).data).toEqual(
    workspace(),
  );
  expect(memory.has(STORAGE_KEY)).toBe(true);
});
it("ships eight source records without fabricated personal access", () => {
  const w = initialWorkspace(NOW);
  parseImport(JSON.stringify(w));
  expect(w.providers).toHaveLength(8);
  expect(w.inventory.map((a) => a.providerId)).toEqual(["scratchpad"]);
  expect(w.providers.every((p) => p.ratings.quality === null)).toBe(true);
  const d = recommend(w.task, w.providers, w.inventory, w.hardware, NOW);
  expect(d.ready.map((r) => r.providerId)).toEqual(["scratchpad"]);
});
it("merges unfamiliar providers without inventing access, then ranks once verified", () => {
  const w = mergeRegistry(workspace(), {
    schemaVersion: 1,
    kind: "pick-me-registry",
    providers: [provider("new-image", { capabilities: ["image"] })],
  });
  expect(w.inventory).toHaveLength(1);
  expect(
    recommend(
      task({ capabilities: ["image"] }),
      w.providers,
      w.inventory,
      w.hardware,
      NOW,
    ).conditional[0].providerId,
  ).toBe("new-image");
  expect(
    recommend(
      task({ capabilities: ["image"] }),
      w.providers,
      [...w.inventory, access("new-image")],
      w.hardware,
      NOW,
    ).ready[0].providerId,
  ).toBe("new-image");
});
it("bounds history size without trimming task or inventory", () => {
  const t = task({
    text: "a".repeat(20000),
    inputs: "b".repeat(20000),
    successCriteria: "c".repeat(20000),
  });
  let w = workspace();
  const d = recommend(t, w.providers, w.inventory, w.hardware, NOW);
  for (let i = 0; i < 35; i++) w = recordDecision(w, t, d);
  expect(w.decisions.length).toBeLessThan(30);
  expect(w.decisions.length).toBeGreaterThan(0);
  expect(w.task).toEqual(t);
  expect(w.inventory).toEqual(workspace().inventory);
  expect(() => parseImport(JSON.stringify(w, null, 2))).not.toThrow();
});
it("does not transfer personal entitlements to a different client after a registry update", () => {
  const w = mergeRegistry(workspace(), {
    schemaVersion: 1,
    kind: "pick-me-registry",
    providers: [
      provider("fixture-editor", {
        client: "Different API",
        zeroCost: false,
        kind: "ai",
      }),
    ],
  });
  const d = recommend(w.task, w.providers, w.inventory, w.hardware, NOW);
  expect(d.ready).toHaveLength(0);
  expect(d.conditional).toHaveLength(1);
});
it("preserves legacy unscoped inventory but requires a fresh client-specific observation", () => {
  const legacy = JSON.parse(JSON.stringify(workspace()));
  delete legacy.inventory[0].client;
  const loaded = parseImport(JSON.stringify(legacy));
  expect(loaded.kind).toBe("pick-me-workspace");
  if (loaded.kind !== "pick-me-workspace")
    throw new Error("Expected workspace");
  expect(loaded.inventory[0].plan).toBe(legacy.inventory[0].plan);
  expect(
    recommend(
      loaded.task,
      loaded.providers,
      loaded.inventory,
      loaded.hardware,
      NOW,
    ).ready,
  ).toHaveLength(0);
});
