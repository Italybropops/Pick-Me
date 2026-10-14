import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
export const stateNames: Record<string, string> = {
  ready: "Ready now",
  setup: "Free setup needed",
  "free-setup": "Free setup needed",
  conditional: "Requires verification",
  uncertain: "Allowance uncertain",
  exhausted: "Allowance exhausted",
  paid: "Paid",
  unverified: "Unverified",
  excluded: "Excluded",
  verified: "Verified",
  stale: "Stale",
  conflicting: "Conflicting",
};
export function Badge({
  state,
  children,
}: {
  state: string;
  children?: ReactNode;
}) {
  return (
    <span className={`badge badge-${state}`}>
      {children ?? stateNames[state] ?? state}
    </span>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<{ id?: string }>, { id })
        : children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Icon({
  name = "arrow",
  className = "",
}: {
  name?: "arrow" | "grid" | "clock" | "swap" | "spark" | "document";
  className?: string;
}) {
  const paths = {
    arrow: "M5 19 19 5M5 5h14v14",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    clock: "M12 7v5l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
    swap: "M3 7h17m-5-5 5 5-5 5M21 17H4m5-5-5 5 5 5",
    spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z",
    document: "M5 3h14v18H5zM8 7h8M8 11h8M8 15h8",
  };
  return (
    <svg
      className={`ui-icon ${className}`}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <label className="check" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    titleId = useId(),
    opener = useRef(document.activeElement as HTMLElement | null);
  useEffect(() => {
    dialog.current?.showModal();
    const el = dialog.current;
    return () => {
      el?.close();
      if (opener.current?.isConnected) opener.current.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="modal-head">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function CopyButton({
  text,
  label = "Copy execution prompt",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false),
    [fallback, setFallback] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setFallback(true);
    }
  }
  return (
    <>
      <button type="button" className="secondary" onClick={copy}>
        {label} <Icon />
      </button>
      {copied && (
        <small role="status" className="copy-status">
          Copied to clipboard
        </small>
      )}
      {fallback && (
        <Modal title="Copy this text" onClose={() => setFallback(false)}>
          <p>
            Clipboard access is unavailable. Select and copy the text below.
          </p>
          <textarea
            aria-label="Text to copy"
            readOnly
            value={text}
            rows={12}
            onFocus={(e) => e.target.select()}
            autoFocus
          />
        </Modal>
      )}
    </>
  );
}
export function displayDate(date: string | null) {
  return date ? new Date(date).toLocaleString() : "Never";
}
export function inputDate(date: string | null) {
  if (!date) return "";
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function fromInputDate(value: string) {
  return value ? new Date(value).toISOString() : null;
}
export function download(name: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
