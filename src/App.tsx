import { useEffect, useMemo, useState } from "react";
import { recommend, interpretTask } from "./core/engine";
import {
  loadWorkspace,
  saveWorkspace,
  recordDecision,
  STORAGE_KEY,
} from "./core/storage";
import { parseImport } from "./core/data";
import { initialWorkspace } from "./data/seed";
import type { Task, Workspace } from "./core/schema";
import { TaskForm } from "./ui/TaskForm";
import { Recommendations } from "./ui/Recommendations";
import { Inventory } from "./ui/Inventory";
import { EvidenceLibrary } from "./ui/EvidenceLibrary";
import { Backup } from "./ui/Backup";
import { download, Icon } from "./ui/common";
type Page = "routes" | "inventory" | "evidence" | "backup";
const nav: [Page, string, "arrow" | "grid" | "clock" | "swap"][] = [
  ["routes", "Find a route", "arrow"],
  ["inventory", "Tool inventory", "grid"],
  ["evidence", "Evidence library", "clock"],
  ["backup", "Backup & discovery", "swap"],
];
export default function App() {
  const [loaded] = useState(() => {
    try {
      return loadWorkspace(localStorage);
    } catch {
      return {
        data: initialWorkspace(),
        error:
          "Browser storage is unavailable. Export your edits before leaving.",
      };
    }
  });
  const [workspace, setWorkspace] = useState<Workspace>(loaded.data),
    [page, setPage] = useState<Page>("routes"),
    [error, setError] = useState(loaded.error),
    [paused, setPaused] = useState(!!loaded.error),
    [notice, setNotice] = useState("");
  const [clock, setClock] = useState(new Date().toISOString());
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date().toISOString()), 60000);
    return () => clearInterval(timer);
  }, []);
  const decision = useMemo(
    () =>
      recommend(
        workspace.task,
        workspace.providers,
        workspace.inventory,
        workspace.hardware,
        clock,
      ),
    [
      workspace.task,
      workspace.providers,
      workspace.inventory,
      workspace.hardware,
      clock,
    ],
  );
  useEffect(() => {
    if (!paused) {
      try {
        setError(saveWorkspace(localStorage, workspace));
      } catch {
        setError(
          "Browser storage is unavailable. Export a backup before leaving.",
        );
      }
    }
  }, [workspace, paused]);
  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setPaused(true);
        setError(
          "Another tab changed this workspace. Saving is paused to preserve both versions. Export your current work and reload to load the other tab’s data.",
        );
      }
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);
  function update(fn: (w: Workspace) => Workspace) {
    setWorkspace((w) => ({ ...fn(w), savedAt: new Date().toISOString() }));
  }
  function run(t: Task) {
    const now = new Date().toISOString(),
      d = recommend(
        t,
        workspace.providers,
        workspace.inventory,
        workspace.hardware,
        now,
      );
    setClock(now);
    update((w) => recordDecision(w, t, d));
    setNotice(
      `Updated routes: ${d.ready.length} ready, ${d.setup.length} free setup, ${d.conditional.length} requiring verification.`,
    );
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <a href="#main" className="brand" onClick={() => setPage("routes")}>
          <span className="brand-symbol" aria-hidden="true">
            p<Icon />
          </span>
          <span>
            pick-me<span className="brand-dot">.</span>
          </span>
        </a>
        <p className="brand-caption">
          LESS GUESSWORK.
          <br />
          MORE GOOD WORK.
        </p>
        <nav aria-label="Main navigation">
          {nav.map(([id, label, icon]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              aria-current={page === id ? "page" : undefined}
              onClick={() => {
                setPage(id);
                setNotice("");
                window.scrollTo({ top: 0 });
              }}
            >
              <Icon name={icon} />
              {label}
              {page === id && (
                <span className="nav-dot" aria-hidden="true">
                  •
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="status-dot" /> <strong>Local by design</strong>
          <p>
            Your workspace lives in this browser. Your decisions stay yours.
          </p>
          <span className="micro">MVP 0.1 · NO ACCOUNT NEEDED</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>PERSONAL TOOL & WORKFLOW SELECTOR</span>
          <span className="budget-pill">
            <span aria-hidden="true">◉</span> $0 additional spend
          </span>
        </header>
        <main id="main" tabIndex={-1}>
          {error && (
            <div role="alert" className="error storage-error">
              {error}
              {paused && (
                <div className="button-row">
                  <button
                    className="secondary"
                    onClick={() => {
                      try {
                        const raw = localStorage.getItem(STORAGE_KEY);
                        if (raw)
                          download("pick-me-backup-original-storage.json", raw);
                      } catch {
                        setNotice(
                          "Stored data cannot be accessed. Export the in-memory workspace from Backup & discovery.",
                        );
                      }
                    }}
                  >
                    Download original stored data
                  </button>
                  <button
                    className="text-button"
                    onClick={() => {
                      setPaused(false);
                      setError(null);
                    }}
                  >
                    Resume saving this workspace
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="sr-only" role="status">
            {notice}
          </div>
          {page === "routes" && (
            <>
              <div className="hero">
                <div>
                  <span className="eyebrow">THE RIGHT TOOL. A REASON WHY.</span>
                  <h1>A clearer next step.</h1>
                  <p>
                    Tell us what you’re making. Find a practical route
                    <br className="desktop-break" /> with the tools, access, and
                    budget you actually have.
                  </p>
                </div>
                <div className="hero-mark" aria-hidden="true">
                  <Icon />
                  <small>
                    MAKE A<br />
                    GOOD PICK.
                  </small>
                </div>
              </div>
              <div className="example-row">
                <span className="micro">TRY A TASK</span>
                {[
                  [
                    "Checklist",
                    "Organize a few rough notes into a clear checklist.",
                  ],
                  ["Private notes", "Organize private notes offline."],
                  [
                    "An illustration",
                    "Create an image for a fictional garden club.",
                  ],
                  [
                    "A short video",
                    "Create a short video about a fictional planet.",
                  ],
                  [
                    "A toolchain",
                    "Write a brief then create an image for a fictional cafe.",
                  ],
                ].map(([label, text]) => (
                  <button
                    className="example-chip"
                    key={label}
                    onClick={() => run(interpretTask(text))}
                  >
                    {label}
                    <Icon />
                  </button>
                ))}
              </div>
              <div className="workspace-grid">
                <TaskForm task={workspace.task} onRun={run} />
                <Recommendations
                  decision={decision}
                  workspace={workspace}
                  onDraft={(scratchpad) =>
                    update((w) => ({ ...w, scratchpad }))
                  }
                />
              </div>
            </>
          )}
          {page === "inventory" && (
            <Inventory
              workspace={workspace}
              onAccess={(a) => {
                update((w) => ({
                  ...w,
                  inventory: [
                    ...w.inventory.filter(
                      (old) => old.providerId !== a.providerId,
                    ),
                    a,
                  ],
                }));
                setNotice("Inventory observation saved.");
              }}
              onHardware={(hardware) => update((w) => ({ ...w, hardware }))}
            />
          )}
          {page === "evidence" && (
            <EvidenceLibrary
              providers={workspace.providers}
              onProvider={(p) => {
                const candidate = {
                  ...workspace,
                  providers: workspace.providers.map((old) =>
                    old.id === p.id ? p : old,
                  ),
                };
                parseImport(JSON.stringify(candidate));
                update(() => candidate);
              }}
            />
          )}
          {page === "backup" && (
            <Backup
              workspace={workspace}
              onImport={(w) => {
                setWorkspace(w);
                setPaused(false);
                setError(null);
                setNotice(
                  "Import applied. Recommendations will be recalculated using current evidence.",
                );
              }}
            />
          )}
          <footer>
            <span>Made for thoughtful choices.</span>
            <span>Rules-based · No inference API · No telemetry</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
