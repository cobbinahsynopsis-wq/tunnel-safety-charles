import type { RiskEntry, RiskLevel } from "@/data/systems";
import { RiskBadge } from "./RiskBadge";
import { EditableCell } from "./EditableCell";
import { Plus, Trash2 } from "lucide-react";

const severityLabels = ["", "Negligible", "Minor", "Moderate", "Major", "Catastrophic"];
const probabilityLabels = ["", "Improbable", "Remote", "Occasional", "Probable", "Frequent"];

function getCellLevel(s: number, p: number): RiskLevel {
  const score = s * p;
  if (score >= 16) return "critical";
  if (score >= 9) return "high";
  if (score >= 4) return "medium";
  return "low";
}

function getRiskLevel(s: number, p: number): RiskLevel {
  const score = s * p;
  if (score >= 16) return "critical";
  if (score >= 9) return "high";
  if (score >= 4) return "medium";
  return "low";
}

const cellColors: Record<RiskLevel, string> = {
  low: "bg-risk-low/20 border-risk-low/30",
  medium: "bg-risk-medium/20 border-risk-medium/30",
  high: "bg-risk-high/20 border-risk-high/30",
  critical: "bg-risk-critical/20 border-risk-critical/30",
};

interface RiskMatrixProps {
  entries: RiskEntry[];
  onUpdate?: (entryId: string, updates: Partial<RiskEntry>) => void;
  onAdd?: (entry: RiskEntry) => void;
  onDelete?: (entryId: string) => void;
}

export function RiskMatrix({ entries, onUpdate, onAdd, onDelete }: RiskMatrixProps) {
  const getEntriesAt = (s: number, p: number) =>
    entries.filter((e) => e.severity === s && e.probability === p);

  const handleNumericUpdate = (entryId: string, field: "severity" | "probability", value: string) => {
    const num = Math.max(1, Math.min(5, parseInt(value) || 1));
    const entry = entries.find(e => e.id === entryId);
    if (!entry || !onUpdate) return;
    const s = field === "severity" ? num : entry.severity;
    const p = field === "probability" ? num : entry.probability;
    onUpdate(entryId, { [field]: num, riskLevel: getRiskLevel(s, p) });
  };

  const handleAdd = () => {
    if (!onAdd) return;
    onAdd({
      id: `risk-${Date.now()}`,
      hazard: "New hazard",
      severity: 3,
      probability: 3,
      riskLevel: getRiskLevel(3, 3),
    });
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-right font-mono text-muted-foreground w-24">Sev \ Prob</th>
              {[1, 2, 3, 4, 5].map((p) => (
                <th key={p} className="px-2 py-1.5 text-center font-mono w-28 text-muted-foreground">
                  <div>{p}</div>
                  <div className="text-[9px] font-normal">{probabilityLabels[p]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[5, 4, 3, 2, 1].map((s) => (
              <tr key={s}>
                <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">
                  <div>{s}</div>
                  <div className="text-[9px]">{severityLabels[s]}</div>
                </td>
                {[1, 2, 3, 4, 5].map((p) => {
                  const level = getCellLevel(s, p);
                  const cellEntries = getEntriesAt(s, p);
                  return (
                    <td key={p} className={`px-2 py-2 border text-center align-top min-w-[100px] ${cellColors[level]}`}>
                      <div className="text-[9px] font-mono font-semibold uppercase mb-1 opacity-60">{level}</div>
                      {cellEntries.map((e) => (
                        <div key={e.id} className="text-[10px] leading-tight mt-1 text-foreground">{e.hazard}</div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        <div className="border rounded-sm overflow-hidden">
          <table className="w-full text-xs table-zebra">
            <thead>
              <tr className="bg-muted">
                <th className="px-3 py-2 text-left font-semibold">Hazard</th>
                <th className="px-3 py-2 text-center font-mono font-semibold">Severity</th>
                <th className="px-3 py-2 text-center font-mono font-semibold">Probability</th>
                <th className="px-3 py-2 text-center font-semibold">Risk Level</th>
                {onDelete && <th className="px-2 py-2 w-8"></th>}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-border group">
                  <td className="px-3 py-1.5">
                    <EditableCell value={e.hazard} onSave={v => onUpdate?.(e.id, { hazard: v })} />
                  </td>
                  <td className="px-3 py-1.5 text-center font-mono">
                    <EditableCell value={e.severity} type="number" onSave={v => handleNumericUpdate(e.id, "severity", v)} />
                  </td>
                  <td className="px-3 py-1.5 text-center font-mono">
                    <EditableCell value={e.probability} type="number" onSave={v => handleNumericUpdate(e.id, "probability", v)} />
                  </td>
                  <td className="px-3 py-1.5 text-center"><RiskBadge level={e.riskLevel} /></td>
                  {onDelete && (
                    <td className="px-2 py-1.5">
                      <button onClick={() => onDelete(e.id)} className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity" title="Delete">
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
          <button onClick={handleAdd} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1">
            <Plus className="h-3.5 w-3.5" /> Add risk entry
          </button>
        )}
      </div>
    </div>
  );
}
