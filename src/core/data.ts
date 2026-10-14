import {
  RegistrySchema,
  WorkspaceSchema,
  safeUrl,
  type Evidence,
  type ImportData,
  type Provider,
  type Workspace,
} from "./schema";
export const MAX_BYTES = 2_000_000;
export function fresh(at: string | null, days: number, now: string): boolean {
  if (!at) return false;
  const elapsed = Date.parse(now) - Date.parse(at);
  return Number.isFinite(elapsed) && elapsed >= 0 && elapsed <= days * 86400000;
}
export function evidenceStatus(e: Evidence, now: string): Evidence["status"] {
  if (e.status === "conflicting") return "conflicting";
  if (e.status === "uncertain" || !e.verifiedAt) return "uncertain";
  return e.status === "stale" || !fresh(e.verifiedAt, e.freshnessDays, now)
    ? "stale"
    : "verified";
}
export function parseImport(raw: string): ImportData {
  if (new TextEncoder().encode(raw).length > MAX_BYTES)
    throw new Error("File size exceeds the 2 MB limit.");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON. The current data has not changed.");
  }
  if (
    !value ||
    typeof value !== "object" ||
    !("schemaVersion" in value) ||
    value.schemaVersion !== 1
  )
    throw new Error(
      "Unsupported schemaVersion. Only version 1 is supported; migrate a copy and preserve your original file.",
    );
  const result = (
    "kind" in value && value.kind === "pick-me-registry"
      ? RegistrySchema
      : WorkspaceSchema
  ).safeParse(value);
  if (!result.success)
    throw new Error(
      result.error.issues
        .slice(0, 5)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("\n"),
    );
  const data = result.data;
  const unique = (ids: string[], label: string) => {
    if (new Set(ids).size !== ids.length)
      throw new Error(`Duplicate ${label} IDs.`);
  };
  unique(
    data.providers.map((p) => p.id),
    "provider",
  );
  unique(
    data.providers.flatMap((p) => p.evidence.map((e) => e.id)),
    "evidence",
  );
  if (data.kind === "pick-me-workspace") {
    unique(
      data.inventory.map((a) => a.providerId),
      "inventory",
    );
    const ids = new Set(data.providers.map((p) => p.id));
    if (data.inventory.some((a) => !ids.has(a.providerId)))
      throw new Error("Inventory references an unknown provider.");
    for (const d of data.decisions) {
      if (
        [...d.ready, ...d.setup, ...d.conditional, ...d.excluded].some(
          (r) => !ids.has(r.providerId),
        ) ||
        d.workflow?.stages.some((s) => !ids.has(s.providerId))
      )
        throw new Error("Decision references an unknown provider.");
    }
  }
  return data;
}
export function exportWorkspace(data: Workspace): string {
  const formatted = JSON.stringify(data, null, 2);
  const json =
    new TextEncoder().encode(formatted).length <= MAX_BYTES
      ? formatted
      : JSON.stringify(data);
  parseImport(json);
  return json;
}

// A local edit is not a source retrieval or verification event.
export function reviseEvidence(
  original: Evidence | undefined,
  draft: Evidence,
  reviewed = false,
  now = new Date().toISOString(),
): Evidence {
  const changed =
    !original ||
    draft.claim !== original.claim ||
    draft.url !== original.url ||
    draft.scope !== original.scope ||
    draft.sourceType !== original.sourceType ||
    draft.topics.join() !== original.topics.join();
  const sameSource = original?.url === draft.url;
  const needsReview =
    changed || (draft.status === "verified" && original?.status !== "verified");
  return {
    ...draft,
    verifiedAt: reviewed
      ? now
      : changed
        ? null
        : (original?.verifiedAt ?? null),
    status:
      !reviewed && needsReview && draft.status === "verified"
        ? original?.status === "conflicting"
          ? "conflicting"
          : "uncertain"
        : draft.status,
    fetchedAt: sameSource ? original!.fetchedAt : null,
    lastError: sameSource ? original!.lastError : null,
  };
}

export function reviseProvider(original: Provider, draft: Provider): Provider {
  const changedTopics = new Set<Evidence["topics"][number]>();
  const changed = (key: keyof Provider) =>
    JSON.stringify(original[key]) !== JSON.stringify(draft[key]);
  if (changed("client") || changed("kind")) {
    original.evidence
      .concat(draft.evidence)
      .forEach((e) => e.topics.forEach((t) => changedTopics.add(t)));
  }
  if (changed("capabilities") || changed("os") || changed("requiresModel"))
    changedTopics.add("capabilities");
  if (changed("offline")) changedTopics.add("offline");
  if (changed("commercial")) changedTopics.add("commercial");
  if (changed("zeroCost")) changedTopics.add("cost");
  if (changed("inputs") || changed("outputs")) changedTopics.add("formats");
  if (original.ratings.quality !== draft.ratings.quality)
    changedTopics.add("quality");
  if (changed("integrations"))
    ["automation", "cost", "offline"].forEach((t) =>
      changedTopics.add(t as Evidence["topics"][number]),
    );
  return {
    ...draft,
    evidence: draft.evidence.map((e) => {
      const revised = reviseEvidence(
        original.evidence.find((old) => old.id === e.id),
        e,
      );
      return e.topics.some((t) => changedTopics.has(t))
        ? {
            ...revised,
            status:
              revised.status === "conflicting" ? "conflicting" : "uncertain",
            verifiedAt: null,
          }
        : revised;
    }),
  };
}

export function applyEvidenceRefresh(
  current: Workspace,
  providerId: string,
  original: Evidence,
  refreshed: Evidence,
): Workspace {
  return {
    ...current,
    providers: current.providers.map((p) =>
      p.id !== providerId
        ? p
        : {
            ...p,
            evidence: p.evidence.map((e) =>
              e.id !== original.id || e.url !== original.url
                ? e
                : {
                    ...e,
                    fetchedAt: refreshed.lastError
                      ? e.fetchedAt
                      : e.fetchedAt &&
                          refreshed.fetchedAt &&
                          Date.parse(e.fetchedAt) >
                            Date.parse(refreshed.fetchedAt)
                        ? e.fetchedAt
                        : refreshed.fetchedAt,
                    lastError: refreshed.lastError,
                  },
            ),
          },
    ),
  };
}
export async function refreshEvidence(
  e: Evidence,
  fetcher: typeof fetch = fetch,
  now = new Date().toISOString(),
): Promise<Evidence> {
  try {
    safeUrl.parse(e.url);
    const response = await fetcher(e.url, {
      credentials: "omit",
      referrerPolicy: "no-referrer",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (response.url) safeUrl.parse(response.url);
    const reader = response.body?.getReader();
    let bytes = 0;
    if (reader) {
      try {
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          bytes += part.value.byteLength;
          if (bytes > 500000)
            throw new Error("Source exceeds 500 KB retrieval limit.");
        }
      } finally {
        await reader.cancel();
      }
    }
    return { ...e, fetchedAt: now, lastError: null };
  } catch (error) {
    return {
      ...e,
      lastError:
        `Refresh failed: ${error instanceof Error ? error.message : "Network or browser restriction"}`.slice(
          0,
          1000,
        ),
    };
  }
}
export function mergeRegistry(
  current: Workspace,
  incoming: ImportData,
): Workspace {
  if (incoming.kind === "pick-me-workspace") return incoming;
  const providers = new Map(current.providers.map((p) => [p.id, p]));
  incoming.providers.forEach((p) => providers.set(p.id, p));
  const merged = {
    ...current,
    providers: [...providers.values()],
    decisions: [],
    savedAt: new Date().toISOString(),
  };
  parseImport(JSON.stringify(merged));
  return merged;
}
