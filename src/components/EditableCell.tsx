import { useState, useRef, useEffect } from "react";

interface EditableCellProps {
  value: string | number;
  onSave: (value: string) => void;
  className?: string;
  type?: "text" | "number";
}

export function EditableCell({ value, onSave, className = "", type = "text" }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== String(value)) onSave(draft.trim());
  };

  if (!editing) {
    return (
      <span
        className={`cursor-pointer hover:bg-accent/50 px-0.5 rounded-sm transition-colors ${className}`}
        onDoubleClick={() => setEditing(true)}
        title="Double-click to edit"
      >
        {value}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type={type}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(String(value)); setEditing(false); } }}
      className="bg-background border border-ring rounded-sm px-1 py-0.5 text-xs w-full outline-none"
    />
  );
}
