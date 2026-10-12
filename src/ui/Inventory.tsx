import { useState } from "react";
import {
  AccessSchema,
  HardwareSchema,
  type Access,
  type Hardware,
  type Provider,
  type Workspace,
} from "../core/schema";
import { emptyAccess } from "../data/seed";
import {
  Badge,
  Check,
  displayDate,
  Field,
  fromInputDate,
  inputDate,
  Modal,
  stateNames,
  Icon,
} from "./common";
function AccessEditor({
  provider,
  initial,
  onSave,
  onClose,
}: {
  provider: Provider;
  initial: Access;
  onSave: (a: Access) => void;
  onClose: () => void;
}) {
  const [a, setA] = useState(initial),
    [error, setError] = useState("");
  const set = <K extends keyof Access>(key: K, value: Access[K]) =>
    setA((a) => ({ ...a, [key]: value }));
  return (
    <Modal title={`Edit ${provider.name}`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = AccessSchema.safeParse({
            ...a,
            provenance: "user-reported",
          });
          if (!parsed.success) {
            setError(
              parsed.error.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join(" "),
            );
            return;
          }
          onSave(parsed.data);
          onClose();
        }}
      >
        <p className="muted">
          Record what you can actually confirm in{" "}
          <strong>{provider.client}</strong>. These are your dated observations,
          separate from public evidence.
        </p>
        <div className="form-grid">
          <Field label="Access state">
            <select
              value={a.status}
              onChange={(e) =>
                set("status", e.target.value as Access["status"])
              }
            >
              {[
                "ready",
                "free-setup",
                "uncertain",
                "exhausted",
                "paid",
                "unverified",
              ].map((s) => (
                <option value={s} key={s}>
                  {stateNames[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Plan or access description">
            <input
              maxLength={500}
              value={a.plan}
              onChange={(e) => set("plan", e.target.value)}
              placeholder="e.g. Free desktop app"
            />
          </Field>
          <Field
            label="Incremental cost ($)"
            hint="Blank means unknown. Included subscription access is not API credit."
          >
            <input
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              value={a.incrementalCost ?? ""}
              onChange={(e) =>
                set(
                  "incrementalCost",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </Field>
          <Field label="Observation freshness (days)">
            <input
              type="number"
              min="1"
              max="365"
              value={a.freshnessDays}
              onChange={(e) => set("freshnessDays", Number(e.target.value))}
            />
          </Field>
        </div>
        <fieldset>
          <legend>Readiness checks</legend>
          {(
            [
              ["installed", "Client is installed / accessible"],
              ["setupConfirmed", "Setup is complete and working"],
              ["modelsReady", "Selected model is downloaded and working"],
              ["hardwareConfirmed", "Selected model fits my hardware"],
              [
                "localVerified",
                "Local-only operation tested; no network features",
              ],
              [
                "licenseConfirmed",
                "Exact model, inputs, and output rights checked",
              ],
              [
                "automationVerified",
                "Programmable integration tested for this client",
              ],
            ] as const
          ).map(([key, label]) => (
            <Check
              key={key}
              label={label}
              checked={a[key]}
              onChange={(v) => set(key, v)}
            />
          ))}
        </fieldset>
        <div className="divider" />
        <h3>Allowance observation</h3>
        <p className="small muted">
          For metered plans, observations expire after 24 hours. A reset date is
          a reminder, not proof that quota has renewed.
        </p>
        <div className="form-grid">
          <Field label="Allowance type">
            <select
              value={a.allowance.kind}
              onChange={(e) =>
                set("allowance", {
                  ...a.allowance,
                  kind: e.target.value as Access["allowance"]["kind"],
                })
              }
            >
              <option value="unknown">Unknown</option>
              <option value="unlimited">Unmetered / no inference quota</option>
              <option value="metered">Metered included allowance</option>
            </select>
          </Field>
          <Field
            label="Shared allowance pool ID"
            hint="Use the same ID across clients that share a quota."
          >
            <input
              required
              maxLength={100}
              pattern="[a-zA-Z0-9][a-zA-Z0-9._-]*"
              value={a.allowance.poolId}
              onChange={(e) =>
                set("allowance", { ...a.allowance, poolId: e.target.value })
              }
            />
          </Field>
          <Field label="Remaining allowance">
            <input
              type="number"
              min="0"
              value={a.allowance.remaining ?? ""}
              onChange={(e) =>
                set("allowance", {
                  ...a.allowance,
                  remaining:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </Field>
          <Field label="Measured demand per run">
            <input
              type="number"
              min="0.001"
              step="any"
              value={a.allowance.perRun ?? ""}
              onChange={(e) =>
                set("allowance", {
                  ...a.allowance,
                  perRun: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </Field>
          <Field label="Allowance units">
            <input
              maxLength={500}
              value={a.allowance.unit}
              onChange={(e) =>
                set("allowance", { ...a.allowance, unit: e.target.value })
              }
            />
          </Field>
          <Field label="Reset time (if known)">
            <input
              type="datetime-local"
              value={inputDate(a.allowance.resetsAt)}
              onChange={(e) =>
                set("allowance", {
                  ...a.allowance,
                  resetsAt: fromInputDate(e.target.value),
                })
              }
            />
          </Field>
          <Field label="Access checked at">
            <input
              type="datetime-local"
              value={inputDate(a.checkedAt)}
              onChange={(e) => set("checkedAt", fromInputDate(e.target.value))}
            />
          </Field>
          <Field label="Allowance checked at">
            <input
              type="datetime-local"
              value={inputDate(a.allowance.checkedAt)}
              onChange={(e) =>
                set("allowance", {
                  ...a.allowance,
                  checkedAt: fromInputDate(e.target.value),
                })
              }
            />
          </Field>
        </div>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            const now = new Date().toISOString();
            setA((a) => ({
              ...a,
              checkedAt: now,
              allowance: { ...a.allowance, checkedAt: now },
            }));
          }}
        >
          Record observation now
        </button>
        <div className="divider" />
        <h3>Actual model menus</h3>
        <p className="small muted">
          Only an exact match for “{provider.client}” is eligible for guidance.
          Enter settings exactly as shown; never infer them from another app.
        </p>
        {a.menus.map((menu, index) => (
          <fieldset className="menu-entry" key={index}>
            <legend>Model {index + 1}</legend>
            <Field label={`Client/interface ${index + 1}`}>
              <input
                required
                value={menu.client}
                onChange={(e) =>
                  set(
                    "menus",
                    a.menus.map((m, i) =>
                      i === index ? { ...m, client: e.target.value } : m,
                    ),
                  )
                }
              />
            </Field>
            <Field label={`Model name ${index + 1}`}>
              <input
                required
                value={menu.model}
                onChange={(e) =>
                  set(
                    "menus",
                    a.menus.map((m, i) =>
                      i === index ? { ...m, model: e.target.value } : m,
                    ),
                  )
                }
              />
            </Field>
            <Field
              label={`Supported settings ${index + 1}`}
              hint="Comma separated. Use default if the client has no reasoning control."
            >
              <input
                required
                value={menu.settings.join(", ")}
                onChange={(e) =>
                  set(
                    "menus",
                    a.menus.map((m, i) =>
                      i === index
                        ? {
                            ...m,
                            settings: e.target.value
                              .split(",")
                              .map((s) => s.trim()),
                          }
                        : m,
                    ),
                  )
                }
              />
            </Field>
            <Field label={`Menu checked at ${index + 1}`}>
              <input
                type="datetime-local"
                value={inputDate(menu.checkedAt)}
                onChange={(e) =>
                  set(
                    "menus",
                    a.menus.map((m, i) =>
                      i === index
                        ? { ...m, checkedAt: fromInputDate(e.target.value) }
                        : m,
                    ),
                  )
                }
              />
            </Field>
            <div className="button-row">
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  set(
                    "menus",
                    a.menus.map((m, i) =>
                      i === index
                        ? { ...m, checkedAt: new Date().toISOString() }
                        : m,
                    ),
                  )
                }
              >
                Confirm menu now
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  set(
                    "menus",
                    a.menus.filter((_, i) => i !== index),
                  )
                }
              >
                Remove menu
              </button>
            </div>
          </fieldset>
        ))}
        <button
          type="button"
          className="secondary"
          onClick={() =>
            set("menus", [
              ...a.menus,
              {
                client: provider.client,
                model: "",
                settings: ["default"],
                checkedAt: null,
              },
            ])
          }
        >
          Add model menu
        </button>
        <Field label="Notes (local only)">
          <textarea
            rows={2}
            maxLength={20000}
            value={a.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            Save inventory entry
          </button>
        </div>
      </form>
    </Modal>
  );
}
function HardwareEditor({
  initial,
  onSave,
}: {
  initial: Hardware;
  onSave: (h: Hardware) => void;
}) {
  const [h, setH] = useState(initial),
    [saved, setSaved] = useState(false),
    [error, setError] = useState("");
  return (
    <details className="card">
      <summary>Hardware & local readiness</summary>
      <p className="muted small">
        Cloud cannot inspect your Mac. The build brief mentions an M2 Pro with
        16 GB unified memory as user-reported; confirm your current machine and
        the selected model separately.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = HardwareSchema.safeParse({
            ...h,
            checkedAt: new Date().toISOString(),
          });
          if (!parsed.success) {
            setError("Enter valid hardware details.");
            return;
          }
          onSave(parsed.data);
          setSaved(true);
          setError("");
        }}
      >
        <div className="form-grid">
          <Field label="Operating system">
            <select
              value={h.os}
              onChange={(e) =>
                setH({ ...h, os: e.target.value as Hardware["os"] })
              }
            >
              {["unknown", "macos", "linux", "windows"].map((os) => (
                <option key={os}>{os}</option>
              ))}
            </select>
          </Field>
          <Field label="Memory (GB)">
            <input
              type="number"
              min="1"
              max="4096"
              value={h.memoryGb ?? ""}
              onChange={(e) =>
                setH({
                  ...h,
                  memoryGb: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </Field>
        </div>
        <Field label="Hardware description">
          <input
            maxLength={500}
            value={h.description}
            onChange={(e) => setH({ ...h, description: e.target.value })}
          />
        </Field>
        <button className="secondary" type="submit">
          Save hardware observation
        </button>
        {saved && <small role="status">Saved as user-reported.</small>}
        {error && <p role="alert">{error}</p>}
      </form>
    </details>
  );
}
export function Inventory({
  workspace: w,
  onAccess,
  onHardware,
}: {
  workspace: Workspace;
  onAccess: (a: Access) => void;
  onHardware: (h: Hardware) => void;
}) {
  const [editing, setEditing] = useState<Provider | null>(null);
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">YOUR ACCESS, NOT ASSUMPTIONS</span>
        <h1>Tools on your terms.</h1>
        <p>
          Track what you have, what works, and what still needs checking. All
          observations stay in your browser.
        </p>
      </div>
      <HardwareEditor initial={w.hardware} onSave={onHardware} />
      <div className="inventory-grid">
        {w.providers.map((p) => {
          const a = w.inventory.find((a) => a.providerId === p.id);
          return (
            <article
              className="card inventory-card"
              key={p.id}
              data-testid={`inventory-${p.id}`}
            >
              <div className="section-line">
                <span className="tool-icon" aria-hidden="true">
                  <Icon name={p.kind === "manual" ? "document" : "spark"} />
                </span>
                <Badge state={a?.status ?? "unverified"} />
              </div>
              <h2>{p.name}</h2>
              <p className="micro">{p.client}</p>
              <p>{p.description}</p>
              <div className="inventory-facts">
                <span>Incremental cost</span>
                <strong>
                  {a?.incrementalCost == null
                    ? "Unknown"
                    : `$${a.incrementalCost}`}
                </strong>
                <span>Allowance</span>
                <strong>
                  {a?.allowance.kind === "unlimited"
                    ? "Unmetered"
                    : a?.allowance.kind === "metered"
                      ? `${a.allowance.remaining ?? "?"} ${a.allowance.unit}`
                      : "Unknown"}
                </strong>
                <span>Provenance</span>
                <strong>{a?.provenance ?? "No observation"}</strong>
                <span>Last checked</span>
                <strong>{displayDate(a?.checkedAt ?? null)}</strong>
              </div>
              <button
                className="secondary full"
                onClick={() => setEditing(p)}
                aria-label={`Edit ${p.name}`}
              >
                Edit access & settings <Icon />
              </button>
            </article>
          );
        })}
      </div>
      {editing && (
        <AccessEditor
          provider={editing}
          initial={
            w.inventory.find((a) => a.providerId === editing.id) ??
            emptyAccess(editing.id)
          }
          onSave={onAccess}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
