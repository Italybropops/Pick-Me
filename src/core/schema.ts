import { z } from "zod";

export const VERSION = 1 as const;
export const capabilities = [
  "writing",
  "organization",
  "coding",
  "research",
  "image",
  "video",
] as const;
const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/);
const short = z.string().max(500);
const text = z.string().max(20000);
const date = z.iso.datetime({ offset: true }).nullable();
export const safeUrl = z
  .string()
  .max(2000)
  .refine((value) => {
    try {
      const u = new URL(value);
      return (
        u.protocol === "https:" &&
        !u.username &&
        !u.password &&
        !u.port &&
        u.hostname.includes(".") &&
        !/^[\d.]+$/.test(u.hostname) &&
        !u.hostname.startsWith("[") &&
        !/(^|\.)(localhost|local|internal|test|invalid)$/.test(u.hostname)
      );
    } catch {
      return false;
    }
  }, "Use a public HTTPS URL without credentials or a custom port.");
export const EvidenceSchema = z.strictObject({
  id,
  claim: z.string().min(1).max(4000),
  topics: z
    .array(
      z.enum([
        "capabilities",
        "offline",
        "commercial",
        "cost",
        "formats",
        "automation",
        "quality",
      ]),
    )
    .min(1)
    .max(7),
  url: safeUrl,
  sourceType: z.enum([
    "official-docs",
    "official-repository",
    "release-notes",
    "benchmark",
    "user-reported",
    "project-code",
  ]),
  scope: z.string().min(1).max(1000),
  status: z.enum(["verified", "uncertain", "stale", "conflicting"]),
  verifiedAt: date,
  fetchedAt: date,
  freshnessDays: z.number().int().min(1).max(3650),
  lastError: z.string().max(1000).nullable(),
});
const rating = z.number().min(0).max(5);
export const ProviderSchema = z.strictObject({
  schemaVersion: z.literal(VERSION),
  id,
  name: z.string().min(1).max(100),
  description: short,
  client: z.string().min(1).max(200),
  kind: z.enum(["manual", "ai"]),
  capabilities: z.array(z.enum(capabilities)).min(1).max(6),
  offline: z.boolean().nullable(),
  commercial: z.boolean().nullable(),
  zeroCost: z.boolean().nullable(),
  os: z
    .array(z.enum(["any", "macos", "linux", "windows"]))
    .min(1)
    .max(4),
  requiresModel: z.boolean(),
  inputs: z.array(z.string().min(1).max(100)).min(1).max(20),
  outputs: z.array(z.string().min(1).max(100)).min(1).max(20),
  ratings: z.strictObject({
    quality: rating.nullable(),
    speed: rating,
    ease: rating,
    interoperability: rating,
    automation: rating,
  }),
  integrations: z
    .array(
      z.strictObject({
        name: short,
        purpose: short,
        destination: short,
        support: z.enum(["verified", "unknown"]),
        setup: short,
        cost: z.number().min(0).nullable(),
        role: z.enum(["required", "optional", "unnecessary"]),
      }),
    )
    .max(20),
  evidence: z.array(EvidenceSchema).min(1).max(50),
});
export const AccessSchema = z.strictObject({
  providerId: id,
  status: z.enum([
    "ready",
    "free-setup",
    "uncertain",
    "exhausted",
    "paid",
    "unverified",
  ]),
  installed: z.boolean(),
  setupConfirmed: z.boolean(),
  plan: short,
  incrementalCost: z.number().min(0).max(1000000).nullable(),
  checkedAt: date,
  provenance: z.enum(["user-reported", "synthetic", "app-builtin"]),
  freshnessDays: z.number().int().min(1).max(365),
  localVerified: z.boolean(),
  hardwareConfirmed: z.boolean(),
  licenseConfirmed: z.boolean(),
  automationVerified: z.boolean(),
  modelsReady: z.boolean(),
  allowance: z.strictObject({
    kind: z.enum(["unlimited", "metered", "unknown"]),
    remaining: z.number().min(0).nullable(),
    unit: short,
    checkedAt: date,
    resetsAt: date,
    poolId: id,
    perRun: z.number().positive().nullable(),
  }),
  menus: z
    .array(
      z.strictObject({
        client: z.string().min(1).max(200),
        model: z.string().min(1).max(200),
        settings: z.array(z.string().min(1).max(100)).min(1).max(30),
        checkedAt: date,
      }),
    )
    .max(30),
  notes: text,
});
export const HardwareSchema = z.strictObject({
  os: z.enum(["unknown", "macos", "linux", "windows"]),
  memoryGb: z.number().positive().max(4096).nullable(),
  description: short,
  provenance: z.literal("user-reported"),
  checkedAt: date,
});
export const WeightsSchema = z.strictObject({
  fit: rating,
  quality: rating,
  speed: rating,
  setup: rating,
  ease: rating,
  interoperability: rating,
  automation: rating,
  cost: rating,
});
export const TaskSchema = z.strictObject({
  schemaVersion: z.literal(VERSION),
  id,
  text: z.string().min(1).max(20000),
  capabilities: z.array(z.enum(capabilities)).min(1).max(3),
  desiredOutput: short,
  successCriteria: text,
  inputs: text,
  deadline: short,
  privacy: z.enum(["public", "private"]),
  offline: z.boolean(),
  commercial: z.boolean(),
  automation: z.enum(["manual", "prefer", "required"]),
  weights: WeightsSchema,
  tieThreshold: z.number().min(0).max(30),
  maxStages: z.number().int().min(1).max(3),
});
const routeStatus = z.enum(["ready", "setup", "conditional", "excluded"]);
export const RouteSchema = z.strictObject({
  providerId: id,
  status: routeStatus,
  score: z.number().min(0).max(100),
  reasons: z.array(short).max(50),
  factors: z.record(z.string().max(100), rating),
  guidance: text,
  prompt: z.string().max(65000),
  evidenceIds: z.array(id).max(50),
});
export const StageSchema = z.strictObject({
  schemaVersion: z.literal(VERSION),
  id,
  providerId: id,
  capability: z.enum(capabilities),
  input: short,
  output: short,
  handoff: short,
  prerequisites: z.array(short).max(50),
  completionCheck: short,
  guidance: text,
  incrementalCost: z.number().min(0).nullable(),
  status: routeStatus,
});
export const DecisionSchema = z.strictObject({
  schemaVersion: z.literal(VERSION),
  id,
  taskId: id,
  createdAt: z.iso.datetime({ offset: true }),
  ready: z.array(RouteSchema).max(100),
  setup: z.array(RouteSchema).max(100),
  conditional: z.array(RouteSchema).max(100),
  excluded: z.array(RouteSchema).max(100),
  comparison: z
    .strictObject({
      providerIds: z.tuple([id, id]),
      difference: z.number(),
      threshold: z.number(),
      test: short,
    })
    .nullable(),
  workflow: z
    .strictObject({
      status: routeStatus,
      stages: z.array(StageSchema).min(1).max(3),
      notes: z.array(short).max(50),
      iterations: z.literal(1),
      qualityCheck: short,
      escalation: short,
      stop: short,
      extraCost: short,
    })
    .nullable(),
  nextAction: text,
});
export const WorkspaceSchema = z.strictObject({
  schemaVersion: z.literal(VERSION),
  kind: z.literal("pick-me-workspace"),
  providers: z.array(ProviderSchema).max(100),
  inventory: z.array(AccessSchema).max(100),
  hardware: HardwareSchema,
  task: TaskSchema,
  scratchpad: text,
  decisions: z.array(DecisionSchema).max(30),
  savedAt: z.iso.datetime({ offset: true }),
});
export const RegistrySchema = z.strictObject({
  schemaVersion: z.literal(VERSION),
  kind: z.literal("pick-me-registry"),
  providers: z.array(ProviderSchema).min(1).max(100),
});
export type Provider = z.infer<typeof ProviderSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type Access = z.infer<typeof AccessSchema>;
export type Hardware = z.infer<typeof HardwareSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type Stage = z.infer<typeof StageSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type Workspace = z.infer<typeof WorkspaceSchema>;
export type ImportData = Workspace | z.infer<typeof RegistrySchema>;
