import { useState } from "react";
import {
  EvidenceSchema,
  ProviderSchema,
  type Evidence,
  type Provider,
} from "../core/schema";
import { evidenceStatus, refreshEvidence } from "../core/data";
import { Badge, Check, displayDate, Field, Modal } from "./common";
function EvidenceEditor({
  evidence: initial,
  onSave,
  onClose,
}: {
  evidence: Evidence;
  onSave: (e: Evidence) => void;
  onClose: () => void;
}) {
  const [e, setE] = useState(initial),
    [reviewed, setReviewed] = useState(false),
    [error, setError] = useState("");
  return (
    <Modal title="Review a specific claim" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const changed =
            e.claim !== initial.claim ||
            e.url !== initial.url ||
            e.scope !== initial.scope ||
            e.topics.join() !== initial.topics.join() ||
            e.sourceType !== initial.sourceType;
          const result = EvidenceSchema.safeParse({
            ...e,
            verifiedAt: reviewed
              ? new Date().toISOString()
              : changed
                ? null
                : e.verifiedAt,
            status:
              e.status === "verified" &&
              !reviewed &&
              (changed || initial.status !== "verified")
                ? "uncertain"
                : e.status,
          });
          if (!result.success) {
            setError(result.error.issues.map((i) => i.message).join(" "));
            return;
          }
          onSave(result.data);
          onClose();
        }}
      >
        <Field label="Specific claim">
          <textarea
            required
            rows={4}
            value={e.claim}
            onChange={(ev) => setE({ ...e, claim: ev.target.value })}
          />
        </Field>
        <Field label="Source URL">
          <input
            type="url"
            required
            value={e.url}
            onChange={(ev) => setE({ ...e, url: ev.target.value })}
          />
        </Field>
        <Field label="Relevant client / plan / region scope">
          <textarea
            required
            rows={2}
            value={e.scope}
            onChange={(ev) => setE({ ...e, scope: ev.target.value })}
          />
        </Field>
        <div className="form-grid">
          <Field label="Evidence status">
            <select
              value={e.status}
              onChange={(ev) =>
                setE({ ...e, status: ev.target.value as Evidence["status"] })
              }
            >
              {["verified", "uncertain", "stale", "conflicting"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Source type">
            <select
              value={e.sourceType}
              onChange={(ev) =>
                setE({
                  ...e,
                  sourceType: ev.target.value as Evidence["sourceType"],
                })
              }
            >
              {[
                "official-docs",
                "official-repository",
                "release-notes",
                "benchmark",
                "user-reported",
                "project-code",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Freshness window (days)">
            <input
              type="number"
              min="1"
              max="3650"
              value={e.freshnessDays}
              onChange={(ev) =>
                setE({ ...e, freshnessDays: Number(ev.target.value) })
              }
            />
          </Field>
        </div>
        <fieldset>
          <legend>Claims covered</legend>
          {(
            [
              "capabilities",
              "offline",
              "commercial",
              "cost",
              "formats",
              "automation",
              "quality",
            ] as const
          ).map((topic) => (
            <Check
              key={topic}
              label={topic}
              checked={e.topics.includes(topic)}
              onChange={(v) =>
                setE({
                  ...e,
                  topics: v
                    ? [...e.topics, topic]
                    : e.topics.filter((t) => t !== topic),
                })
              }
            />
          ))}
        </fieldset>
        <Check
          label="I reviewed this specific claim and scope against the source now"
          checked={reviewed}
          onChange={setReviewed}
        />
        <p className="small muted">
          Saving a changed claim without review clears its verification.
          Fetching a page never verifies a claim.
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button type="submit" className="primary">
          Save evidence review
        </button>
      </form>
    </Modal>
  );
}
export function EvidenceLibrary({
  providers,
  onProvider,
}: {
  providers: Provider[];
  onProvider: (p: Provider) => void;
}) {
  const [editing, setEditing] = useState<{ p: Provider; e: Evidence } | null>(
      null,
    ),
    [record, setRecord] = useState<Provider | null>(null),
    [json, setJson] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState<string | null>(null),
    [search, setSearch] = useState("");
  const update = (p: Provider, e: Evidence) =>
    onProvider({
      ...p,
      evidence: p.evidence.map((old) => (old.id === e.id ? e : old)),
    });
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">CLAIMS WITH A PAPER TRAIL</span>
        <h1>Know what you know.</h1>
        <p>
          Official sources, dated reviews, and honest unknowns. Provider facts
          never establish your personal access.
        </p>
      </div>
      <div className="notice">
        <strong>Retrieved ≠ verified</strong>
        <p>
          Refresh retrieves only the linked source, without your task or
          credentials. Cross-origin restrictions may block it. Review the claim
          before recording verification. Failed refreshes preserve the
          last-known evidence.
        </p>
      </div>
      <Field label="Find a tool or claim">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter evidence…"
        />
      </Field>
      {providers
        .filter((p) =>
          `${p.name} ${p.evidence.map((e) => e.claim).join(" ")}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
        .map((p) => (
          <section className="card evidence-provider" key={p.id}>
            <div className="section-heading">
              <h2>{p.name}</h2>
              <button
                className="text-button"
                onClick={() => {
                  setRecord(p);
                  setJson(JSON.stringify(p, null, 2));
                  setError("");
                }}
              >
                Edit provider record
              </button>
            </div>
            <p className="micro">{p.client} · PUBLIC CAPABILITY REGISTRY</p>
            {p.evidence.map((e) => (
              <article className="evidence-item" key={e.id}>
                <div className="tags">
                  <Badge state={evidenceStatus(e, new Date().toISOString())} />
                  <span className="tag">{e.sourceType}</span>
                  {e.topics.map((t) => (
                    <span className="micro" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                <p>{e.claim}</p>
                <p className="small muted">Scope: {e.scope}</p>
                <a
                  href={e.url}
                  target="_blank"
                  rel="noreferrer"
                  className="source-url"
                >
                  {e.url} ↗
                </a>
                <dl className="evidence-dates">
                  <dt>Verified</dt>
                  <dd>{displayDate(e.verifiedAt)}</dd>
                  <dt>Fetched</dt>
                  <dd>{displayDate(e.fetchedAt)}</dd>
                  <dt>Freshness</dt>
                  <dd>{e.freshnessDays} days</dd>
                </dl>
                {e.lastError && <p className="error small">{e.lastError}</p>}
                <div className="button-row">
                  <button
                    className="secondary"
                    disabled={busy !== null}
                    onClick={async () => {
                      setBusy(e.id);
                      const refreshed = await refreshEvidence(e);
                      update(p, refreshed);
                      setBusy(null);
                    }}
                  >
                    {busy === e.id ? "Retrieving…" : "Refresh source"}
                  </button>
                  <button
                    className="text-button"
                    onClick={() => setEditing({ p, e })}
                  >
                    Review claim
                  </button>
                </div>
              </article>
            ))}
          </section>
        ))}
      {editing && (
        <EvidenceEditor
          evidence={editing.e}
          onSave={(e) => update(editing.p, e)}
          onClose={() => setEditing(null)}
        />
      )}
      {record && (
        <Modal
          title={`Provider record · ${record.name}`}
          onClose={() => setRecord(null)}
        >
          <p className="small muted">
            Advanced: edit source-backed capability flags, supported formats,
            and integration facts. Unknown is null. Keep provenance and IDs;
            changing evidence claims requires a new review. Scores other than
            quality are editable preference heuristics.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                const parsed = ProviderSchema.parse(JSON.parse(json));
                if (parsed.id !== record.id)
                  throw new Error(
                    "Keep the stable provider ID. Import a new record to add a tool.",
                  );
                parsed.evidence = parsed.evidence.map((ev) => {
                  const old = record.evidence.find((o) => o.id === ev.id);
                  return !old ||
                    ev.claim !== old.claim ||
                    ev.url !== old.url ||
                    ev.scope !== old.scope ||
                    ev.topics.join() !== old.topics.join()
                    ? { ...ev, verifiedAt: null, status: "uncertain" }
                    : { ...ev, verifiedAt: old.verifiedAt };
                });
                onProvider(parsed);
                setRecord(null);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Invalid record");
              }
            }}
          >
            <Field label="Provider JSON">
              <textarea
                rows={22}
                maxLength={100000}
                spellCheck={false}
                className="code-input"
                value={json}
                onChange={(e) => setJson(e.target.value)}
              />
            </Field>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="primary" type="submit">
              Save provider record
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
