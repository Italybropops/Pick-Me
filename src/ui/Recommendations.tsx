import type { Decision, Provider, Route, Workspace } from "../core/schema";
import { Badge, CopyButton, Icon } from "./common";
import { evidenceStatus } from "../core/data";
function RouteCard({ route, provider }: { route: Route; provider: Provider }) {
  return (
    <article className={`route-card ${route.status}`}>
      <div className="route-title">
        <span className="tool-icon" aria-hidden="true">
          <Icon name={provider.kind === "manual" ? "document" : "spark"} />
        </span>
        <div>
          <h3>{provider.name}</h3>
          <p className="micro">{provider.client}</p>
        </div>
        <div className="score">
          <strong>{route.score}</strong>
          <small>/ 100 fit</small>
        </div>
      </div>
      <p>{provider.description}</p>
      <div className="tags">
        <Badge state={route.status} />
        {provider.kind === "manual" && (
          <span className="tag">No AI needed</span>
        )}
        <span className="tag">{provider.capabilities.join(" · ")}</span>
      </div>
      <p className="guidance">{route.guidance}</p>
      <details>
        <summary>
          Why this route? <span className="micro">FACTORS & EVIDENCE</span>
        </summary>
        <div className="factor-list">
          {Object.entries(route.factors).map(([key, value]) => (
            <div key={key}>
              <span>{key}</span>
              <meter
                min="0"
                max="5"
                value={value}
                aria-label={`${key}: ${value} out of 5`}
              />
              <b>{value}</b>
            </div>
          ))}
        </div>
        <ul className="reason-list">
          {route.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        <div className="source-list">
          {provider.evidence.map((e) => (
            <p key={e.id}>
              <Badge state={evidenceStatus(e, new Date().toISOString())} />{" "}
              <a href={e.url} target="_blank" rel="noreferrer">
                {e.sourceType} source ↗
              </a>
              <small>{e.claim}</small>
            </p>
          ))}
        </div>
      </details>
      <details>
        <summary>Integrations & handoffs</summary>
        <p className="small">
          Manual copy/export is the default. Pick-Me does not run external
          tools.
        </p>
        {provider.integrations.length ? (
          provider.integrations.map((i, index) => (
            <p className="small" key={index}>
              <strong>
                {i.name} · {i.role}
              </strong>
              <br />
              {i.purpose}
              <br />
              Destination: {i.destination} · Support: {i.support}
              <br />
              Setup: {i.setup}
              <br />
              Incremental cost:{" "}
              {i.cost === null ? "unknown — verify" : `$${i.cost}`}
            </p>
          ))
        ) : (
          <p className="small">
            Unnecessary: no integration is needed for a manual single-tool
            route.
          </p>
        )}
      </details>
      <details>
        <summary>Execution brief</summary>
        <pre className="prompt">{route.prompt}</pre>
      </details>
      <div className="card-actions">
        <CopyButton text={route.prompt} />
      </div>
    </article>
  );
}
export function Recommendations({
  decision: d,
  workspace: w,
  onDraft,
}: {
  decision: Decision;
  workspace: Workspace;
  onDraft: (text: string) => void;
}) {
  const provider = (id: string) => w.providers.find((p) => p.id === id)!;
  const sections: [string, string, Route[]][] = [
    ["ready", "Ready now", d.ready],
    ["setup", "Available after free setup", d.setup],
    ["conditional", "Requires verification", d.conditional],
  ];
  const all = [...d.ready, ...d.setup, ...d.conditional];
  const pair = d.comparison?.providerIds.map(
    (id) => all.find((r) => r.providerId === id)!,
  );
  return (
    <div className="results">
      <div className="section-line">
        <span className="eyebrow">02 / YOUR ROUTES</span>
        <span className="micro">EXPLAINABLE BY DESIGN</span>
      </div>
      <div className="next-action">
        <span className="mini-icon">
          <Icon />
        </span>
        <div>
          <span className="eyebrow">ONE PRACTICAL NEXT STEP</span>
          <p>{d.nextAction}</p>
        </div>
      </div>
      {pair && (
        <section className="comparison">
          <div className="section-heading">
            <h2>A close call. You choose.</h2>
            <span className="tag">{d.comparison!.difference} point gap</span>
          </div>
          <p className="muted small">
            Within your {d.comparison!.threshold}-point threshold. Two{" "}
            {pair[0].status === "ready" ? "ready" : "conditional/setup"}{" "}
            alternatives; no forced winner.
          </p>
          <div className="compare-cards">
            {pair.map((r, i) => (
              <article className="compare-card" key={r.providerId}>
                <span className="eyebrow">OPTION {i ? "B" : "A"}</span>
                <h3>{provider(r.providerId).name}</h3>
                <Badge state={r.status} />
                <p>
                  Choose {i ? "B" : "A"} if{" "}
                  {r.factors.ease >= r.factors.automation
                    ? "ease and a direct manual workflow matter most"
                    : "verified automation matters most"}{" "}
                  and this client fits your working habits.
                </p>
                <strong>{r.score} / 100 preference score</strong>
              </article>
            ))}
          </div>
          <div className="table-scroll">
            <table>
              <caption>Tradeoffs at a glance</caption>
              <thead>
                <tr>
                  <th scope="col">Factor</th>
                  {pair.map((r) => (
                    <th scope="col" key={r.providerId}>
                      {provider(r.providerId).name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  "ease",
                  "speed",
                  "setup",
                  "interoperability",
                  "automation",
                ].map((f) => (
                  <tr key={f}>
                    <th scope="row">{f}</th>
                    {pair.map((r) => (
                      <td key={r.providerId}>
                        {r.factors[f]} / 5{" "}
                        {r.factors[f] >= 4
                          ? "· strength"
                          : r.factors[f] <= 2
                            ? "· tradeoff"
                            : "· neutral"}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row">Unknowns / cons</th>
                  {pair.map((r) => (
                    <td key={r.providerId}>
                      {r.reasons.find((reason) => !reason.startsWith("Score"))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="small">
            <strong>Resolve the choice:</strong> {d.comparison!.test}
          </p>
        </section>
      )}
      {sections.map(([key, title, routes]) => (
        <section
          key={key}
          data-testid={`${key}-routes`}
          className="route-section"
        >
          <div className="section-heading">
            <h2>{title}</h2>
            <span className="count">{routes.length}</span>
          </div>
          {routes.length ? (
            routes.map((r) => (
              <RouteCard
                key={r.providerId}
                route={r}
                provider={provider(r.providerId)}
              />
            ))
          ) : key === "ready" ? (
            <p className="empty">
              No ready routes for these constraints. Review the missing facts
              below or edit the task.
            </p>
          ) : (
            <p className="empty small">No routes in this category.</p>
          )}
        </section>
      ))}
      {d.workflow && (
        <section className="card workflow">
          <div className="section-heading">
            <h2>A bounded toolchain</h2>
            <Badge state={d.workflow.status} />
          </div>
          <p className="muted">
            {d.workflow.stages.length} stages · one initial pass · manual
            handoffs
          </p>
          {d.ready.length > 0 && (
            <p className="small">
              Single-tool alternative: {provider(d.ready[0].providerId).name}{" "}
              can satisfy all required capabilities. Start there if a chain adds
              no value.
            </p>
          )}
          <ol className="stages">
            {d.workflow.stages.map((s) => (
              <li key={s.id}>
                <h3>
                  {provider(s.providerId).name}{" "}
                  <span className="micro">/ {s.capability}</span>
                </h3>
                <Badge state={s.status} />
                <p>{s.guidance}</p>
                <dl>
                  <dt>Input</dt>
                  <dd>{s.input}</dd>
                  <dt>Output</dt>
                  <dd>{s.output}</dd>
                  <dt>Handoff</dt>
                  <dd>{s.handoff}</dd>
                  <dt>Cost</dt>
                  <dd>
                    {s.incrementalCost === null
                      ? "Unknown"
                      : `$${s.incrementalCost}`}
                  </dd>
                  <dt>Completion check</dt>
                  <dd>{s.completionCheck}</dd>
                </dl>
                <details>
                  <summary>Stage prerequisites</summary>
                  <ul>
                    {s.prerequisites.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ol>
          <ul>
            {d.workflow.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
          <p>
            <strong>Quality check:</strong> {d.workflow.qualityCheck}
          </p>
          <p>
            <strong>Escalation:</strong> {d.workflow.escalation}
          </p>
          <p>
            <strong>Stop:</strong> {d.workflow.stop}
          </p>
          <p>{d.workflow.extraCost}</p>
          <CopyButton
            label="Copy workflow brief"
            text={[
              `Task: ${w.task.text}`,
              "$0 budget. Preserve privacy across every handoff.",
              ...d.workflow.stages.map(
                (s, i) =>
                  `${i + 1}. ${provider(s.providerId).name} — ${s.capability}\n${s.guidance}\nInput: ${s.input}\nOutput: ${s.output}\nHandoff: ${s.handoff}\nCheck: ${s.completionCheck}`,
              ),
              ...d.workflow.notes,
              d.workflow.stop,
            ].join("\n\n")}
          />
        </section>
      )}
      <details className="exclusions">
        <summary>
          Excluded routes <span className="count">{d.excluded.length}</span>
        </summary>
        {d.excluded.map((r) => (
          <div className="excluded-row" key={r.providerId}>
            <strong>{provider(r.providerId).name}</strong>
            <ul>
              {r.reasons
                .filter(
                  (reason) =>
                    !reason.startsWith("Score") &&
                    !reason.startsWith("No current comparative"),
                )
                .map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
            </ul>
          </div>
        ))}
      </details>
      <section className="card scratchpad">
        <span className="eyebrow">A SMALL TOOL, INCLUDED</span>
        <h2>Your local text workspace</h2>
        <p className="muted small">
          Draft, organize, and check your work here. Saved with your workspace;
          nothing is sent to a model.
        </p>
        <label className="field">
          <span>Your local draft</span>
          <textarea
            rows={6}
            maxLength={20000}
            value={w.scratchpad}
            onChange={(e) => onDraft(e.target.value)}
            placeholder="Start with a few notes…"
          />
        </label>
        <CopyButton label="Copy local draft" text={w.scratchpad} />
      </section>
    </div>
  );
}
