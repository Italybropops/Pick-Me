// Deliberately fictional fixtures. These are never shipped as vendor evidence.
import type { Provider, Access, Task, Workspace } from "../src/core/schema";
export const NOW = "2026-10-12T12:00:00.000Z";
export function provider(
  id = "fixture-editor",
  overrides: Partial<Provider> = {},
): Provider {
  return {
    schemaVersion: 1,
    id,
    name: id,
    description: "Synthetic test tool",
    client: "Test desktop",
    kind: "manual",
    capabilities: ["writing", "organization"],
    offline: true,
    commercial: true,
    zeroCost: true,
    os: ["any"],
    requiresModel: false,
    inputs: ["text/plain"],
    outputs: ["text/plain"],
    ratings: {
      quality: null,
      speed: 4,
      ease: 4,
      interoperability: 4,
      automation: 0,
    },
    integrations: [],
    evidence: [
      {
        id: `${id}-evidence`,
        claim:
          "Synthetic capabilities, local operation, and free use for tests.",
        topics: [
          "capabilities",
          "offline",
          "commercial",
          "cost",
          "formats",
          "automation",
        ],
        url: "https://example.com/synthetic-fixture",
        sourceType: "user-reported",
        scope: "Synthetic test desktop only",
        status: "verified",
        verifiedAt: NOW,
        fetchedAt: NOW,
        freshnessDays: 30,
        lastError: null,
      },
    ],
    ...overrides,
  };
}
export function access(
  providerId = "fixture-editor",
  overrides: Partial<Access> = {},
): Access {
  return {
    providerId,
    client: "Test desktop",
    status: "ready",
    installed: true,
    setupConfirmed: true,
    plan: "Synthetic free plan",
    incrementalCost: 0,
    checkedAt: NOW,
    provenance: "user-reported",
    freshnessDays: 30,
    localVerified: true,
    hardwareConfirmed: true,
    licenseConfirmed: true,
    automationVerified: false,
    modelsReady: false,
    allowance: {
      kind: "unlimited",
      remaining: null,
      unit: "actions",
      checkedAt: NOW,
      resetsAt: null,
      poolId: providerId,
      perRun: null,
    },
    menus: [],
    notes: "",
    ...overrides,
  };
}
export function task(overrides: Partial<Task> = {}): Task {
  return {
    schemaVersion: 1,
    id: "test-task",
    text: "Draft a simple checklist",
    capabilities: ["writing"],
    desiredOutput: "",
    successCriteria: "",
    inputs: "",
    deadline: "",
    privacy: "public",
    offline: false,
    commercial: false,
    automation: "manual",
    weights: {
      fit: 5,
      quality: 3,
      speed: 3,
      setup: 3,
      ease: 4,
      interoperability: 2,
      automation: 1,
      cost: 5,
    },
    tieThreshold: 7,
    maxStages: 3,
    ...overrides,
  };
}
export function workspace(): Workspace {
  return {
    schemaVersion: 1,
    kind: "pick-me-workspace",
    providers: [provider()],
    inventory: [access()],
    hardware: {
      os: "unknown",
      memoryGb: null,
      description: "",
      provenance: "user-reported",
      checkedAt: null,
    },
    task: task(),
    scratchpad: "",
    decisions: [],
    savedAt: NOW,
  };
}
