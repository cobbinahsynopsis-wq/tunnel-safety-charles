import { useMemo } from "react";
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";
import { validateAllSystems, getValidationSummary, type ValidationIssue } from "@/utils/validation";
import type { SystemData } from "@/data/systems";

interface ValidationPanelProps {
  systems: SystemData[];
}

const severityIcons: Record<string, React.ElementType> = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const severityColors: Record<string, string> = {
  error: "text-risk-critical",
  warning: "text-risk-high",
  info: "text-muted-foreground",
};

export function ValidationPanel({ systems }: ValidationPanelProps) {
  const issues = useMemo(() => validateAllSystems(systems), [systems]);
  const summary = useMemo(() => getValidationSummary(issues), [issues]);

  const hasIssues = issues.length > 0;

  return (
    <div className="border border-border/50 rounded bg-card/60 backdrop-blur-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
          {hasIssues ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
          Analysis Validation
        </h3>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          {summary.errors > 0 && (
            <span className="text-risk-critical">{summary.errors} errors</span>
          )}
          {summary.warnings > 0 && (
            <span className="text-risk-high">{summary.warnings} warnings</span>
          )}
          {summary.info > 0 && (
            <span className="text-muted-foreground">{summary.info} info</span>
          )}
          {!hasIssues && (
            <span className="text-risk-low">All checks passed</span>
          )}
        </div>
      </div>

      {hasIssues && (
        <div className="max-h-48 overflow-y-auto space-y-1">
          {issues.map((issue, i) => {
            const Icon = severityIcons[issue.severity] ?? Info;
            const color = severityColors[issue.severity] ?? "text-muted-foreground";
            return (
              <div key={i} className="flex items-start gap-2 text-[10px] py-1">
                <Icon className={`h-3 w-3 shrink-0 mt-0.5 ${color}`} />
                <span className="font-mono font-semibold text-muted-foreground shrink-0 w-16">[{issue.category}]</span>
                <span className="font-semibold shrink-0">{issue.systemName}:</span>
                <span className="text-muted-foreground">{issue.message}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
