import type { FMEARow } from "@/data/systems";
import { RiskBadge } from "./RiskBadge";
import { EditableCell } from "./EditableCell";
import { RatingSelector } from "./RatingSelector";
import type { RiskLevel } from "@/data/systems";
import { Plus, Trash2 } from "lucide-react";
import { useCallback } from "react";

function rpnLevel(rpn: number): RiskLevel {
  if (rpn >= 40) return "critical";
  if (rpn >= 25) return "high";
  if (rpn >= 15) return "medium";
  return "low";
}

interface FMEATableProps {
  rows: FMEARow[];
  onUpdate?: (rowId: string, updates: Partial<FMEARow>) => void;
  onAdd?: (row: FMEARow) => void;
  onDelete?: (rowId: string) => void;
}

export function FMEATable({ rows, onUpdate, onAdd, onDelete }: FMEATableProps) {
  const sorted = [...rows].sort((a, b) => b.rpn - a.rpn);

  const handleRatingUpdate = useCallback(
    (rowId: string, field: "severity" | "occurrence" | "detection", newValue: number) => {
      const row = rows.find((r) => r.id === rowId);
      if (!row || !onUpdate) return;
      const clamped = Math.max(1, Math.min(10, newValue));
      const s = field === "severity" ? clamped : row.severity;
      const o = field === "occurrence" ? clamped : row.occurrence;
      const d = field === "detection" ? clamped : row.detection;
      onUpdate(rowId, { [field]: clamped, rpn: s * o * d });
    },
    [rows, onUpdate],
  );

  const handleAdd = useCallback(() => {
    if (!onAdd) return;
    onAdd({
      id: `fmea-${Date.now()}`,
      component: "New Component",
      failureMode: "Failure mode",
      cause: "Cause",
      effect: "Effect",
      severity: 5,
      occurrence: 5,
      detection: 5,
      rpn: 125,
      mitigation: "Mitigation action",
    });
  }, [onAdd]);

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto border rounded-sm">
        <table className="w-full text-xs table-zebra">
          <thead>
            <tr className="bg-muted text-left">
              <th className="px-3 py-2 font-semibold">Component</th>
              <th className="px-3 py-2 font-semibold">Failure Mode</th>
              <th className="px-3 py-2 font-semibold">Cause</th>
              <th className="px-3 py-2 font-semibold">Effect</th>
              <th className="px-3 py-2 font-semibold text-center font-mono">S</th>
              <th className="px-3 py-2 font-semibold text-center font-mono">O</th>
              <th className="px-3 py-2 font-semibold text-center font-mono">D</th>
              <th className="px-3 py-2 font-semibold text-center font-mono">RPN</th>
              <th className="px-3 py-2 font-semibold">Risk</th>
              <th className="px-3 py-2 font-semibold">Mitigation</th>
              {onDelete && <th className="px-2 py-2 w-8"></th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.id} className="border-t border-border group">
                <td className="px-3 py-1.5 font-medium">
                  <EditableCell value={row.component} onSave={(v) => onUpdate?.(row.id, { component: v })} />
                </td>
                <td className="px-3 py-1.5">
                  <EditableCell value={row.failureMode} onSave={(v) => onUpdate?.(row.id, { failureMode: v })} />
                </td>
                <td className="px-3 py-1.5 text-muted-foreground">
                  <EditableCell value={row.cause} onSave={(v) => onUpdate?.(row.id, { cause: v })} />
                </td>
                <td className="px-3 py-1.5">
                  <EditableCell value={row.effect} onSave={(v) => onUpdate?.(row.id, { effect: v })} />
                </td>
                <td className="px-3 py-1.5 text-center">
                  <RatingSelector
                    type="severity"
                    value={row.severity}
                    onSelect={(v) => handleRatingUpdate(row.id, "severity", v)}
                  />
                </td>
                <td className="px-3 py-1.5 text-center">
                  <RatingSelector
                    type="occurrence"
                    value={row.occurrence}
                    onSelect={(v) => handleRatingUpdate(row.id, "occurrence", v)}
                  />
                </td>
                <td className="px-3 py-1.5 text-center">
                  <RatingSelector
                    type="detection"
                    value={row.detection}
                    onSelect={(v) => handleRatingUpdate(row.id, "detection", v)}
                  />
                </td>
                <td className="px-3 py-1.5 text-center font-mono font-bold">{row.rpn}</td>
                <td className="px-3 py-1.5">
                  <RiskBadge level={rpnLevel(row.rpn)} />
                </td>
                <td className="px-3 py-1.5 text-muted-foreground max-w-[200px]">
                  <EditableCell value={row.mitigation} onSave={(v) => onUpdate?.(row.id, { mitigation: v })} />
                </td>
                {onDelete && (
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => onDelete(row.id)}
                      className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity"
                      title="Delete row"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onAdd && (
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1"
        >
          <Plus className="h-3.5 w-3.5" /> Add failure mode
        </button>
      )}
    </div>
  );
}
