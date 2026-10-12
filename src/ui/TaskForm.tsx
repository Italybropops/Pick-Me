import { useEffect, useState } from "react";
import { capabilities, TaskSchema, type Task } from "../core/schema";
import { interpretTask } from "../core/engine";
import { Check, Field, Icon } from "./common";
export function TaskForm({
  task,
  onRun,
}: {
  task: Task;
  onRun: (t: Task) => void;
}) {
  const [draft, setDraft] = useState(task),
    [error, setError] = useState("");
  useEffect(() => setDraft(task), [task]);
  const set = <K extends keyof Task>(key: K, value: Task[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  return (
    <form
      className="card intake"
      onSubmit={(e) => {
        e.preventDefault();
        const result = TaskSchema.safeParse(draft);
        if (!result.success) {
          setError(
            result.error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join(" "),
          );
          return;
        }
        setError("");
        onRun(result.data);
      }}
    >
      <div className="section-line">
        <span className="eyebrow">01 / THE TASK</span>
        <span className="micro">RULES-BASED INTAKE</span>
      </div>
      <h2>What are we making?</h2>
      <Field label="What would you like to do?">
        <textarea
          name="task"
          required
          maxLength={20000}
          rows={5}
          value={draft.text}
          onChange={(e) => set("text", e.target.value)}
          placeholder="Describe your idea, outcome, or problem…"
        />
      </Field>
      <div className="interpret-row">
        <button
          type="button"
          className="text-button"
          onClick={() => {
            const interpreted = interpretTask(draft.text);
            setDraft((d) => ({
              ...d,
              capabilities: interpreted.capabilities,
              privacy: interpreted.privacy,
              offline: interpreted.offline,
              commercial: interpreted.commercial,
            }));
          }}
        >
          Interpret words <Icon className="arrow-down" />
        </button>
        <small>Keyword baseline. Edit below.</small>
      </div>
      <fieldset>
        <legend>
          Required capabilities <small>(up to 3, in workflow order)</small>
        </legend>
        <div className="capabilities">
          {capabilities.map((c) => (
            <label
              key={c}
              className={`cap-chip ${draft.capabilities.includes(c) ? "selected" : ""}`}
            >
              <input
                type="checkbox"
                checked={draft.capabilities.includes(c)}
                onChange={(e) =>
                  set(
                    "capabilities",
                    e.target.checked
                      ? [...draft.capabilities, c]
                      : draft.capabilities.filter((v) => v !== c),
                  )
                }
              />
              {c}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="form-grid">
        <Field label="Desired output">
          <input
            name="output"
            maxLength={500}
            value={draft.desiredOutput}
            onChange={(e) => set("desiredOutput", e.target.value)}
            placeholder="A short, usable checklist"
          />
        </Field>
        <Field label="Deadline">
          <input
            name="deadline"
            maxLength={500}
            value={draft.deadline}
            onChange={(e) => set("deadline", e.target.value)}
            placeholder="e.g. 20 minutes"
          />
        </Field>
      </div>
      <details>
        <summary>Success criteria & inputs</summary>
        <Field label="Success criteria">
          <textarea
            maxLength={20000}
            rows={2}
            value={draft.successCriteria}
            onChange={(e) => set("successCriteria", e.target.value)}
          />
        </Field>
        <Field label="Inputs or references">
          <textarea
            maxLength={20000}
            rows={2}
            value={draft.inputs}
            onChange={(e) => set("inputs", e.target.value)}
          />
        </Field>
      </details>
      <div className="divider" />
      <fieldset>
        <legend>Keep these boundaries</legend>
        <Check
          label="Private data — local processing only"
          checked={draft.privacy === "private"}
          onChange={(v) => set("privacy", v ? "private" : "public")}
        />
        <Check
          label="Offline only"
          checked={draft.offline}
          onChange={(v) => set("offline", v)}
        />
        <Check
          label="Commercial-use rights required"
          checked={draft.commercial}
          onChange={(v) => set("commercial", v)}
        />
      </fieldset>
      <Field label="Automation">
        <select
          value={draft.automation}
          onChange={(e) =>
            set("automation", e.target.value as Task["automation"])
          }
        >
          <option value="manual">Manual steps are fine</option>
          <option value="prefer">Prefer automation</option>
          <option value="required">Verified automation required</option>
        </select>
      </Field>
      <details>
        <summary>Ranking priorities & comparison rules</summary>
        <p className="muted small">
          Scores express preferences. These controls never override a failed
          constraint. Quality is neutral without a current comparative
          benchmark.
        </p>
        {Object.entries(draft.weights).map(([key, value]) => (
          <label className="range-field" key={key}>
            <span>
              {key}
              <strong>{value}</strong>
            </span>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={value}
              onChange={(e) =>
                set("weights", {
                  ...draft.weights,
                  [key]: Number(e.target.value),
                })
              }
            />
          </label>
        ))}
        <Field label="Near-tie threshold (score points)">
          <input
            type="number"
            min="0"
            max="30"
            value={draft.tieThreshold}
            onChange={(e) => set("tieThreshold", Number(e.target.value))}
          />
        </Field>
        <Field label="Maximum workflow stages">
          <input
            type="number"
            min="1"
            max="3"
            value={draft.maxStages}
            onChange={(e) => set("maxStages", Number(e.target.value))}
          />
        </Field>
      </details>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button type="submit" className="primary full">
        Find my route <Icon className="arrow-right" />
      </button>
      <p className="footnote">
        Your task stays in this browser. No AI call is made.
      </p>
    </form>
  );
}
