import type { SafetyFunction, FMEARow, FaultTreeNode } from "@/data/systems";
import { EditableCell } from "./EditableCell";
import { Plus, Trash2, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { calculatePLr } from "@/utils/plrCalculation";
import { useState } from "react";

const plrColors: Record<string, string> = {
  a: "bg-risk-low/20 text-risk-low",
  b: "bg-risk-low/20 text-risk-low",
  c: "bg-risk-medium/20 text-risk-medium",
  d: "bg-risk-high/20 text-risk-high",
  e: "bg-risk-critical/20 text-risk-critical",
};

const plrDescriptions: Record<string, string> = {
  a: "PLr a — Lowest required performance level. Suitable when hazard severity is slight and exposure is infrequent.",
  b: "PLr b — Low performance level. Required when slight injury with frequent exposure, or serious injury with infrequent exposure and good avoidance.",
  c: "PLr c — Medium performance level. Required when serious injury is possible with infrequent exposure but limited avoidance capability.",
  d: "PLr d — High performance level. Required when serious/irreversible injury with frequent exposure but some avoidance possibility.",
  e: "PLr e — Highest required performance level. Mandatory when serious/irreversible injury or death is possible with frequent exposure and avoidance is scarcely possible.",
};

interface SafetyFunctionsTableProps {
  functions: SafetyFunction[];
  fmeaRows?: ReadonlyArray<FMEARow>;
  faultTree?: FaultTreeNode;
  onUpdate?: (sfId: string, updates: Partial<SafetyFunction>) => void;
  onAdd?: (sf: SafetyFunction) => void;
  onDelete?: (sfId: string) => void;
}

export function SafetyFunctionsTable({
  functions,
  fmeaRows,
  faultTree,
  onUpdate,
  onAdd,
  onDelete,
}: SafetyFunctionsTableProps) {
  const [showJustification, setShowJustification] = useState(false);

  const plrResult = fmeaRows && faultTree
    ? calculatePLr(fmeaRows, faultTree)
    : null;

  const handleAdd = () => {
    if (!onAdd) return;
    onAdd({
      id: `sf-${Date.now()}`,
      function: "New safety function",
      plr: plrResult?.plr ?? "c",
      category: plrResult?.category ?? "2",
      description: "Description",
    });
  };

  return (
    <div className="space-y-3">
      {/* Auto-calculated PLr Banner */}
      {plrResult && (
        <div className="border rounded-sm overflow-hidden">
          <div className="bg-muted px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Auto-Determined PLr (ISO 13849-1)
              </span>
            </div>
            <button
              onClick={() => setShowJustification(prev => !prev)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Info className="h-3.5 w-3.5" />
              {showJustification ? "Hide" : "Show"} justification
            </button>
          </div>

          <div className="px-4 py-3">
            <div className="flex items-center gap-6">
              {/* PLr Result */}
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-sm font-mono font-bold text-lg ${plrColors[plrResult.plr] ?? ""}`}>
                  {plrResult.plr.toUpperCase()}
                </span>
                <div>
                  <p className="text-xs font-semibold">Required Performance Level</p>
                  <p className="text-[10px] text-muted-foreground">
                    {plrDescriptions[plrResult.plr] ?? ""}
                  </p>
                </div>
              </div>

              {/* Risk parameters */}
              <div className="flex items-center gap-4 ml-auto">
                <div className="text-center">
                  <span className="block text-[10px] font-mono text-muted-foreground">Severity</span>
                  <span className={`font-mono font-bold text-sm ${plrResult.severityClass === "S2" ? "text-risk-critical" : "text-risk-low"}`}>
                    {plrResult.severityClass}
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-mono text-muted-foreground">Frequency</span>
                  <span className={`font-mono font-bold text-sm ${plrResult.frequency === "F2" ? "text-risk-high" : "text-risk-low"}`}>
                    {plrResult.frequency}
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-mono text-muted-foreground">Avoidance</span>
                  <span className={`font-mono font-bold text-sm ${plrResult.avoidance === "P2" ? "text-risk-high" : "text-risk-low"}`}>
                    {plrResult.avoidance}
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-mono text-muted-foreground">Min Cat.</span>
                  <span className="font-mono font-bold text-sm text-primary">
                    {plrResult.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Justification */}
            {showJustification && (
              <div className="mt-3 bg-muted/50 rounded-sm p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {plrResult.justification}
                  </p>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground/70 italic">
                  Ref: {plrResult.isoReference}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Safety Functions Table */}
      <div className="border rounded-sm overflow-hidden">
        <table className="w-full text-xs table-zebra">
          <thead>
            <tr className="bg-muted">
              <th className="px-3 py-2 text-left font-semibold">Safety Function</th>
              <th className="px-3 py-2 text-center font-mono font-semibold">PLr</th>
              <th className="px-3 py-2 text-center font-mono font-semibold">Cat.</th>
              <th className="px-3 py-2 text-left font-semibold">Description</th>
              {onDelete && <th className="px-2 py-2 w-8"></th>}
            </tr>
          </thead>
          <tbody>
            {functions.map((sf) => (
              <tr key={sf.id} className="border-t border-border group">
                <td className="px-3 py-1.5 font-medium">
                  <EditableCell value={sf.function} onSave={v => onUpdate?.(sf.id, { function: v })} />
                </td>
                <td className="px-3 py-1.5 text-center">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-sm font-mono font-bold text-xs ${plrColors[sf.plr] ?? ""}`}>
                    {sf.plr.toUpperCase()}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-center font-mono">
                  <EditableCell value={sf.category} onSave={v => onUpdate?.(sf.id, { category: v })} />
                </td>
                <td className="px-3 py-1.5 text-muted-foreground">
                  <EditableCell value={sf.description} onSave={v => onUpdate?.(sf.id, { description: v })} />
                </td>
                {onDelete && (
                  <td className="px-2 py-1.5">
                    <button onClick={() => onDelete(sf.id)} className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity" title="Delete">
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
          <Plus className="h-3.5 w-3.5" /> Add safety function
        </button>
      )}
    </div>
  );
}
