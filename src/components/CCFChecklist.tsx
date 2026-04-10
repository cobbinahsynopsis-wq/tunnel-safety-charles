import { useState } from "react";
import { CheckCircle, AlertCircle, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { type CCFChecklistItem, CCF_CHECKLIST_TEMPLATE } from "@/data/systems";

interface CCFChecklistProps {
  checklist: CCFChecklistItem[];
  totalScore: number;
  onChange?: (checklist: CCFChecklistItem[], score: number) => void;
}

export function CCFChecklist({ checklist, totalScore, onChange }: CCFChecklistProps) {
  const [expanded, setExpanded] = useState(false);
  const maxScore = CCF_CHECKLIST_TEMPLATE.reduce((sum, item) => sum + item.score, 0);
  const passed = totalScore >= 65;

  const handleToggle = (itemId: string) => {
    if (!onChange) return;
    const updated = checklist.map(item =>
      item.id === itemId ? { ...item, applied: !item.applied } : item
    );
    const newScore = updated.filter(i => i.applied).reduce((sum, i) => sum + i.score, 0);
    onChange(updated, newScore);
  };

  return (
    <div className="border border-border/50 rounded-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="w-full bg-muted px-4 py-2 flex items-center justify-between hover:bg-muted/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            CCF Analysis — ISO 13849-1 Clause 4.5.4, Table F.1
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono font-bold ${passed ? "text-risk-low" : "text-risk-critical"}`}>
            {totalScore} / {maxScore} pts {passed ? "✓ PASS (≥65)" : "✗ FAIL (<65)"}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-2">
          <p className="text-[10px] text-muted-foreground mb-3">
            Per ISO 13849-1 Table F.1: A minimum score of <strong>65 points</strong> is required to demonstrate 
            adequate measures against Common Cause Failures for Category 2, 3, and 4 architectures.
          </p>

          {/* Progress bar */}
          <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-4">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all ${passed ? "bg-risk-low" : "bg-risk-critical"}`}
              style={{ width: `${Math.min((totalScore / maxScore) * 100, 100)}%` }}
            />
            <div
              className="absolute inset-y-0 border-r-2 border-dashed border-foreground/40"
              style={{ left: `${(65 / maxScore) * 100}%` }}
              title="Minimum required: 65 points"
            />
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-3 py-1.5 text-left font-semibold w-8">✓</th>
                <th className="px-3 py-1.5 text-left font-semibold">Measure against CCF</th>
                <th className="px-3 py-1.5 text-center font-mono font-semibold w-16">Score</th>
              </tr>
            </thead>
            <tbody>
              {checklist.map(item => (
                <tr key={item.id} className="border-t border-border/30">
                  <td className="px-3 py-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-colors ${
                        item.applied
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {item.applied && <CheckCircle className="h-3 w-3" />}
                    </button>
                  </td>
                  <td className={`px-3 py-1.5 ${item.applied ? "text-foreground" : "text-muted-foreground"}`}>
                    {item.measure}
                  </td>
                  <td className={`px-3 py-1.5 text-center font-mono font-bold ${item.applied ? "text-risk-low" : "text-muted-foreground"}`}>
                    {item.applied ? `+${item.score}` : item.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex items-start gap-2 text-[10px] text-muted-foreground">
            {passed ? (
              <>
                <CheckCircle className="h-3 w-3 text-risk-low shrink-0 mt-0.5" />
                <span>CCF measures are adequate. Score of {totalScore} meets the minimum threshold of 65 points per ISO 13849-1 Table F.1.</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 text-risk-critical shrink-0 mt-0.5" />
                <span>CCF measures are <strong>insufficient</strong>. Additional measures required to reach the minimum 65-point threshold. Current deficit: {65 - totalScore} points.</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
