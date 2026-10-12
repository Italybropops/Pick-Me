import type { Access, Evidence, Provider, Workspace } from "../core/schema";
import { interpretTask } from "../core/engine";

// Only claims actually read in the cited official repositories receive a verification time.
// Product menus, per-account access, quotas, and comparative quality remain unknown.
const researchedAt = "2026-10-12T08:56:00.000Z";
function claim(
  id: string,
  url: string,
  text: string,
  topics: Evidence["topics"],
  verified = true,
  scope = "Public repository; no account, region, output license, or allowance verification",
): Evidence {
  return {
    id,
    url,
    claim: text,
    topics,
    sourceType: verified ? "official-repository" : "official-docs",
    scope,
    status: verified ? "verified" : "uncertain",
    fetchedAt: verified ? researchedAt : null,
    verifiedAt: verified ? researchedAt : null,
    freshnessDays: 30,
    lastError: verified
      ? null
      : "Vendor documentation was unavailable to the research environment. Review this source manually.",
  };
}
const base = {
  schemaVersion: 1 as const,
  kind: "ai" as const,
  offline: false,
  commercial: null,
  zeroCost: null,
  os: ["any"] as Provider["os"],
  requiresModel: false,
  inputs: ["text/plain"],
  outputs: ["text/plain"],
  ratings: {
    quality: null,
    speed: 3,
    ease: 3,
    interoperability: 3,
    automation: 0,
  },
  integrations: [],
};
export const seedProviders: Provider[] = [
  {
    ...base,
    id: "scratchpad",
    name: "Local text workspace",
    client: "Pick-Me browser",
    kind: "manual",
    description:
      "Make a checklist, organize notes, or draft text yourself. A small tool is sometimes the whole answer.",
    capabilities: ["writing", "organization"],
    offline: true,
    commercial: true,
    zeroCost: true,
    ratings: {
      quality: null,
      speed: 5,
      ease: 5,
      interoperability: 4,
      automation: 0,
    },
    evidence: [
      {
        ...claim(
          "scratchpad-code",
          "https://github.com/Italybropops/Pick-Me",
          "The included text workspace edits and copies plain text in the browser. It performs no inference or external submission and charges nothing. User-supplied content retains its own rights.",
          ["capabilities", "offline", "commercial", "cost", "formats"],
          true,
          "This MVP build; manual text editing only. A local server is needed to open the app offline.",
        ),
        sourceType: "project-code",
        freshnessDays: 365,
      },
    ],
  },
  {
    ...base,
    id: "chatgpt",
    name: "ChatGPT",
    client: "ChatGPT web",
    description:
      "A conversational candidate for drafting and research. Verify current capabilities, plan limits, and the web model menu.",
    capabilities: ["writing", "research", "coding"],
    evidence: [
      claim(
        "chatgpt-capabilities",
        "https://help.openai.com/en/articles/9275245-using-chatgpt-s-free-tier-faq",
        "Candidate: conversational writing and research in the web client. Current feature availability and free-tier limits need verification.",
        ["capabilities", "cost", "formats"],
        false,
      ),
    ],
  },
  {
    ...base,
    id: "codex",
    name: "Codex CLI",
    client: "Codex CLI",
    description:
      "A coding agent with a local client. Local execution of the client does not establish offline model inference.",
    capabilities: ["coding"],
    evidence: [
      claim(
        "codex-capabilities",
        "https://raw.githubusercontent.com/openai/codex/main/README.md",
        "The official README describes Codex CLI as a coding agent running locally and documents ChatGPT-plan sign-in. Individual access and included allowance are not established.",
        ["capabilities"],
      ),
    ],
    integrations: [
      {
        name: "Repository checkout",
        purpose: "Provide code context for a coding task",
        destination: "Your local working directory in Codex CLI",
        support: "unknown",
        setup:
          "Confirm repository access and client permissions; use a branch.",
        cost: 0,
        role: "optional",
      },
    ],
  },
  {
    ...base,
    id: "flow",
    name: "Google Flow",
    client: "Flow web",
    description:
      "A video-generation candidate. Verify regional availability and whether any current credits are genuinely included.",
    capabilities: ["video"],
    outputs: ["video/mp4"],
    evidence: [
      claim(
        "flow-candidate",
        "https://support.google.com/flow/answer/16353333?hl=en",
        "Candidate for video creation; current capabilities, output formats, regional eligibility, and $0 allowances have not been verified.",
        ["capabilities", "cost", "formats"],
        false,
      ),
    ],
  },
  {
    ...base,
    id: "draw-things",
    name: "Draw Things",
    client: "Draw Things macOS",
    description:
      "Local image generation candidate. Check the exact downloaded model, memory fit, offline operation, and its license.",
    capabilities: ["image"],
    offline: null,
    os: ["macos"],
    requiresModel: true,
    outputs: ["image/png"],
    evidence: [
      claim(
        "draw-things-images",
        "https://raw.githubusercontent.com/drawthingsai/draw-things-community/main/README.md",
        "The official community repository contains image generation models, samplers, and app data models and documents a local inference CLI on macOS. This does not establish the app’s model-specific hardware or output license.",
        ["capabilities"],
      ),
      claim(
        "draw-things-app",
        "https://drawthings.ai/",
        "Confirm app cost, offline behavior, available export formats, and the selected model’s terms in the actual macOS client.",
        ["offline", "cost", "formats"],
        false,
      ),
    ],
  },
  {
    ...base,
    id: "ollama",
    name: "Ollama",
    client: "Ollama local",
    description:
      "Run a chosen local model. Model download, memory requirements, network behavior, and licensing require separate checks.",
    capabilities: ["writing", "coding"],
    offline: null,
    requiresModel: true,
    ratings: {
      quality: null,
      speed: 3,
      ease: 2,
      interoperability: 4,
      automation: 4,
    },
    evidence: [
      claim(
        "ollama-models",
        "https://raw.githubusercontent.com/ollama/ollama/main/README.md",
        "Ollama documents chatting with models and a REST API for running and managing them, with macOS, Windows, and Linux install paths. Confirm task performance for the specific model.",
        ["capabilities", "automation"],
      ),
      claim(
        "ollama-local",
        "https://docs.ollama.com/",
        "Confirm the chosen model is local, its download is complete, network features are off, and its terms permit the intended use.",
        ["offline", "cost", "formats"],
        false,
      ),
    ],
    integrations: [
      {
        name: "Local REST API",
        purpose: "Future local-agent handoff",
        destination: "Your Ollama instance",
        support: "verified",
        setup:
          "Verify the model, loopback binding, and client. Pick-Me does not call this API.",
        cost: null,
        role: "optional",
      },
    ],
  },
  {
    ...base,
    id: "gemini-cli",
    name: "Gemini CLI",
    client: "Gemini CLI",
    description:
      "A terminal agent beyond the example tools. Free-tier documentation is a starting point, not proof of personal quota.",
    capabilities: ["coding", "research", "writing"],
    evidence: [
      claim(
        "gemini-cli-agent",
        "https://raw.githubusercontent.com/google-gemini/gemini-cli/main/README.md",
        "The official README describes an agent for coding and content generation, built-in search tooling, and a personal-account free tier. Verify sign-in eligibility and actual remaining allowance; do not enable billing.",
        ["capabilities", "cost"],
      ),
    ],
  },
  {
    ...base,
    id: "libreoffice",
    name: "LibreOffice",
    client: "LibreOffice desktop",
    kind: "manual",
    description:
      "A free office suite for deliberate drafting and organizing documents, without inference.",
    capabilities: ["writing", "organization"],
    offline: null,
    zeroCost: true,
    ratings: {
      quality: null,
      speed: 4,
      ease: 4,
      interoperability: 4,
      automation: 0,
    },
    evidence: [
      claim(
        "libreoffice-suite",
        "https://raw.githubusercontent.com/LibreOffice/core/master/README.md",
        "LibreOffice is an integrated office suite, open source and free to use, compatible with many document formats. Confirm the needed format in your installed client.",
        ["capabilities", "cost"],
      ),
      claim(
        "libreoffice-local",
        "https://www.libreoffice.org/discover/libreoffice/",
        "Confirm offline operation, extensions, input/output formats, and document licensing in the installed application.",
        ["offline", "formats"],
        false,
      ),
    ],
  },
];
export function emptyAccess(providerId: string): Access {
  return {
    providerId,
    status: "unverified",
    installed: false,
    setupConfirmed: false,
    plan: "",
    incrementalCost: null,
    checkedAt: null,
    provenance: "user-reported",
    freshnessDays: 30,
    localVerified: false,
    hardwareConfirmed: false,
    licenseConfirmed: false,
    automationVerified: false,
    modelsReady: false,
    allowance: {
      kind: "unknown",
      remaining: null,
      unit: "actions",
      checkedAt: null,
      resetsAt: null,
      poolId: providerId,
      perRun: null,
    },
    menus: [],
    notes: "",
  };
}
export function initialWorkspace(now = new Date().toISOString()): Workspace {
  const builtin: Access = {
    ...emptyAccess("scratchpad"),
    status: "ready",
    installed: true,
    setupConfirmed: true,
    plan: "Included manual workspace",
    incrementalCost: 0,
    checkedAt: now,
    provenance: "app-builtin",
    freshnessDays: 365,
    localVerified: true,
    licenseConfirmed: true,
    hardwareConfirmed: true,
    allowance: {
      ...emptyAccess("scratchpad").allowance,
      kind: "unlimited",
      checkedAt: now,
    },
  };
  return {
    schemaVersion: 1,
    kind: "pick-me-workspace",
    providers: structuredClone(seedProviders),
    inventory: [builtin],
    hardware: {
      os: "unknown",
      memoryGb: null,
      description: "",
      provenance: "user-reported",
      checkedAt: null,
    },
    task: interpretTask("Organize a few rough notes into a clear checklist."),
    scratchpad: "",
    decisions: [],
    savedAt: now,
  };
}
