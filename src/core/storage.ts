import { exportWorkspace, parseImport } from "./data";
import type { Decision, Task, Workspace } from "./schema";
import { initialWorkspace } from "../data/seed";
export const STORAGE_KEY = "pick-me.workspace.v1";
export function loadWorkspace(storage: Pick<Storage, "getItem">): {
  data: Workspace;
  error: string | null;
} {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { data: initialWorkspace(), error: null };
    const data = parseImport(raw);
    if (data.kind !== "pick-me-workspace")
      throw new Error("Expected a workspace backup.");
    return { data, error: null };
  } catch (e) {
    return {
      data: initialWorkspace(),
      error: `Stored data could not be loaded. It has been preserved; saving is paused. ${e instanceof Error ? e.message : "Storage unavailable."}`,
    };
  }
}
export function saveWorkspace(
  storage: Pick<Storage, "setItem">,
  data: Workspace,
): string | null {
  try {
    storage.setItem(STORAGE_KEY, exportWorkspace(data));
    return null;
  } catch {
    return "Browser storage is unavailable or full. Your edits are in memory; export a backup before leaving.";
  }
}
// Keep portable backups below their size bound even for long prompts repeated in decisions.
// Current task, inventory, registry, and draft are never trimmed.
export function recordDecision(
  w: Workspace,
  task: Task,
  decision: Decision,
): Workspace {
  const next = {
    ...w,
    task,
    decisions: [...w.decisions, decision].slice(-30),
    savedAt: decision.createdAt,
  };
  while (
    next.decisions.length &&
    new TextEncoder().encode(JSON.stringify(next, null, 2)).length > 1_500_000
  )
    next.decisions.shift();
  return next;
}
