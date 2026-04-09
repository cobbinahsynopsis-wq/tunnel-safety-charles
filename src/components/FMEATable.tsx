import type { FMEARow } from "@/data/systems";
import { RiskBadge } from "./RiskBadge";
import { EditableCell } from "./EditableCell";
import { RatingSelector } from "./RatingSelector";
import type { RiskLevel } from "@/data/systems";
import { Plus, Trash2, CheckCircle2, AlertTriangle, TrendingDown } from "lucide-react";
import { useCallback } from "react";

function rpnLevel(rpn: number): RiskLevel {
  if (rpn >= 40) return "critical";
  if (rpn >= 25) return "high";
  if (rpn >= 15) return "medium";
  return "low";
}

function reductionPercent(initial: number, residual: number): number {
  if (initial === 0) return 0;
  return Math.round(((initial - residual) / initial) * 100);
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

  const handleResidualUpdate = useCallback(
    (rowId: string, field: "residualSeverity" | "residualOccurrence" | "residualDetection", newValue: number) => {
      const row = rows.find((r) => r.id === rowId);
      if (!row || !onUpdate) return;
      const clamped = Math.max(1, Math.min(10, newValue));
      const s = field === "residualSeverity" ? clamped : (row.residualSeverity ?? row.severity);
      const o = field === "residualOccurrence" ? clamped : (row.residualOccurrence ?? row.occurrence);
      const d = field === "residualDetection" ? clamped : (row.residualDetection ?? row.detection);
      onUpdate(rowId, { [field]: clamped, residualRpn: s * o * d });
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
      residualSeverity: 5,
      residualOccurrence: 3,
      residualDetection: 3,
      residualRpn: 45,
      riskAccepted: false,
    });
  }, [onAdd]);

  // Risk reduction summary
  const totalInitialRpn = rows.reduce((s, r) => s + r.rpn, 0);
  const totalResidualRpn = rows.reduce((s, r) => s + (r.residualRpn ?? r.rpn), 0);
  const acceptedCount = rows.filter((r) => r.riskAccepted === true).length;
  const unacceptedHighCount = rows.filter(
    (r) => !r.riskAccepted && rpnLevel(r.residualRpn ?? r.rpn) !== "low"
  ).length;

  return (
    <div className="space-y-3">
      {/* Risk Reduction Summary Banner */}
      <div className="grid grid-cols-4 gap-3">
        <div className="border rounded-sm p-3 bg-card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-3.5 w-3.5 text-primary" />
            <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">RPN Reduction</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold font-mono">{reductionPercent(totalInitialRpn, totalResidualRpn)}%</span>
            <span className="text-[10px] text-muted-foreground">{totalInitialRpn} → {totalResidualRpn}</span>
          </div>
        </div>
        <div className="border rounded-sm p-3 bg-card">
          <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Initial Avg RPN</div>
          <span className="text-lg font-bold font-mono">
            {rows.length > 0 ? Math.round(totalInitialRpn / rows.length) : 0}
          </span>
        </div>
        <div className="border rounded-sm p-3 bg-card">
          <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Residual Avg RPN</div>
          <span className="text-lg font-bold font-mono text-primary">
            {rows.length > 0 ? Math.round(totalResidualRpn / rows.length) : 0}
          </span>
        </div>
        <div className="border rounded-sm p-3 bg-card">
          <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Risk Status</div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`h-3.5 w-3.5 ${unacceptedHighCount === 0 ? "text-risk-low" : "text-risk-high"}`} />
            <span className="text-xs font-medium">
              {acceptedCount}/{rows.length} accepted
            </span>
          </div>
          {unacceptedHighCount > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle className="h-3 w-3 text-risk-critical" />
              <span className="text-[10px] text-risk-critical font-medium">{unacceptedHighCount} unresolved</span>
            </div>
          )}
        </div>
      </div>

      {/* FMEA Table */}
      <div className="overflow-x-auto border rounded-sm">
        <table className="w-full text-xs table-zebra">
          <thead>
            <tr className="bg-muted text-left">
              <th className="px-2 py-2 font-semibold" rowSpan={2}>Component</th>
              <th className="px-2 py-2 font-semibold" rowSpan={2}>Failure Mode</th>
              <th className="px-2 py-2 font-semibold" rowSpan={2}>Cause</th>
              <th className="px-2 py-2 font-semibold" rowSpan={2}>Effect</th>
              <th className="px-2 py-1 font-semibold text-center border-b border-border" colSpan={4}>
                <span className="text-[9px] uppercase tracking-wider">Initial Assessment</span>
              </th>
              <th className="px-2 py-2 font-semibold" rowSpan={2}>Mitigation</th>
              <th className="px-2 py-1 font-semibold text-center border-b border-primary/30" colSpan={4}>
                <span className="text-[9px] uppercase tracking-wider text-primary">Residual (Post-Mitigation)</span>
              </th>
              <th className="px-2 py-2 font-semibold text-center" rowSpan={2}>
                <span className="text-[9px] uppercase tracking-wider">Reduction</span>
              </th>
              <th className="px-2 py-2 font-semibold text-center" rowSpan={2}>
                <span className="text-[9px] uppercase tracking-wider">Accepted</span>
              </th>
              <th className="px-2 py-2 font-semibold text-center font-mono" rowSpan={2}>Modified</th>
              {onDelete && <th className="px-1 py-2 w-6" rowSpan={2}></th>}
            </tr>
            <tr className="bg-muted text-left">
              <th className="px-2 py-1 font-semibold text-center font-mono text-[10px]">S</th>
              <th className="px-2 py-1 font-semibold text-center font-mono text-[10px]">O</th>
              <th className="px-2 py-1 font-semibold text-center font-mono text-[10px]">D</th>
              <th className="px-2 py-1 font-semibold text-center font-mono text-[10px]">RPN</th>
              <th className="px-2 py-1 font-semibold text-center font-mono text-[10px] text-primary">S'</th>
              <th className="px-2 py-1 font-semibold text-center font-mono text-[10px] text-primary">O'</th>
              <th className="px-2 py-1 font-semibold text-center font-mono text-[10px] text-primary">D'</th>
              <th className="px-2 py-1 font-semibold text-center font-mono text-[10px] text-primary">RPN'</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const residualRpn = row.residualRpn ?? row.rpn;
              const reduction = reductionPercent(row.rpn, residualRpn);
              const residualLevel = rpnLevel(residualRpn);

              return (
                <tr key={row.id} className="border-t border-border group">
                  <td className="px-2 py-1.5 font-medium">
                    <EditableCell value={row.component} onSave={(v) => onUpdate?.(row.id, { component: v })} />
                  </td>
                  <td className="px-2 py-1.5">
                    <EditableCell value={row.failureMode} onSave={(v) => onUpdate?.(row.id, { failureMode: v })} />
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground">
                    <EditableCell value={row.cause} onSave={(v) => onUpdate?.(row.id, { cause: v })} />
                  </td>
                  <td className="px-2 py-1.5">
                    <EditableCell value={row.effect} onSave={(v) => onUpdate?.(row.id, { effect: v })} />
                  </td>
                  {/* Initial S, O, D, RPN */}
                  <td className="px-2 py-1.5 text-center">
                    <RatingSelector type="severity" value={row.severity} onSelect={(v) => handleRatingUpdate(row.id, "severity", v)} />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <RatingSelector type="occurrence" value={row.occurrence} onSelect={(v) => handleRatingUpdate(row.id, "occurrence", v)} />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <RatingSelector type="detection" value={row.detection} onSelect={(v) => handleRatingUpdate(row.id, "detection", v)} />
                  </td>
                  <td className="px-2 py-1.5 text-center font-mono font-bold">{row.rpn}</td>
                  {/* Mitigation */}
                  <td className="px-2 py-1.5 text-muted-foreground max-w-[180px]">
                    <EditableCell value={row.mitigation} onSave={(v) => onUpdate?.(row.id, { mitigation: v })} />
                  </td>
                  {/* Residual S', O', D', RPN' */}
                  <td className="px-2 py-1.5 text-center bg-primary/5">
                    <RatingSelector type="severity" value={row.residualSeverity ?? row.severity} onSelect={(v) => handleResidualUpdate(row.id, "residualSeverity", v)} />
                  </td>
                  <td className="px-2 py-1.5 text-center bg-primary/5">
                    <RatingSelector type="occurrence" value={row.residualOccurrence ?? row.occurrence} onSelect={(v) => handleResidualUpdate(row.id, "residualOccurrence", v)} />
                  </td>
                  <td className="px-2 py-1.5 text-center bg-primary/5">
                    <RatingSelector type="detection" value={row.residualDetection ?? row.detection} onSelect={(v) => handleResidualUpdate(row.id, "residualDetection", v)} />
                  </td>
                  <td className="px-2 py-1.5 text-center font-mono font-bold bg-primary/5">
                    <span className={residualLevel === "critical" ? "text-risk-critical" : residualLevel === "high" ? "text-risk-high" : residualLevel === "medium" ? "text-risk-medium" : "text-risk-low"}>
                      {residualRpn}
                    </span>
                  </td>
                  {/* Reduction % */}
                  <td className="px-2 py-1.5 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`font-mono font-bold text-[10px] ${reduction >= 50 ? "text-risk-low" : reduction >= 25 ? "text-risk-medium" : "text-risk-high"}`}>
                        {reduction > 0 ? `↓${reduction}%` : "—"}
                      </span>
                      <RiskBadge level={residualLevel} />
                    </div>
                  </td>
                  {/* Accepted toggle */}
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => onUpdate?.(row.id, { riskAccepted: !row.riskAccepted })}
                      className={`inline-flex items-center justify-center h-5 w-5 rounded-sm border transition-colors ${
                        row.riskAccepted
                          ? "bg-risk-low/20 border-risk-low text-risk-low"
                          : "border-border text-muted-foreground hover:border-foreground"
                      }`}
                      title={row.riskAccepted ? "Risk accepted (ALARP)" : "Click to accept residual risk"}
                    >
                      {row.riskAccepted && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </button>
                  </td>
                  {/* Modified by */}
                  <td className="px-2 py-1.5 text-center text-[9px] text-muted-foreground font-mono">
                    {row.lastModifiedBy && (
                      <div>
                        <div>{row.lastModifiedBy}</div>
                        {row.lastModifiedAt && <div>{new Date(row.lastModifiedAt).toLocaleDateString()}</div>}
                      </div>
                    )}
                  </td>
                  {onDelete && (
                    <td className="px-1 py-1.5">
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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ISO 12100 Compliance Note */}
      <div className="text-[10px] text-muted-foreground border border-dashed border-border rounded-sm px-3 py-2 bg-muted/30">
        <strong className="text-foreground">ISO 12100 Risk Reduction Verification:</strong> Initial RPN values represent the inherent risk before mitigation.
        Residual values (S', O', D') must be evaluated after implementing mitigation measures. Risk is considered acceptable (ALARP) when
        the residual risk level is &quot;Low&quot; or has been formally accepted by the responsible engineer.
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
