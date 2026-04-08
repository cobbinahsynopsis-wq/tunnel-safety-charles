import { useState, useMemo } from "react";
import { History, Filter, Trash2 } from "lucide-react";
import { type AuditEntry, getActionLabel, loadAuditTrail, clearAuditTrail } from "@/utils/auditTrail";

interface AuditTrailPanelProps {
  entries: AuditEntry[];
  onClear?: () => void;
}

export function AuditTrailPanel({ entries, onClear }: AuditTrailPanelProps) {
  const [filterSystem, setFilterSystem] = useState("all");
  const [filterAction, setFilterAction] = useState("all");

  const systems = useMemo(() => {
    const unique = new Map<string, string>();
    for (const e of entries) {
      unique.set(e.systemId, e.systemName);
    }
    return Array.from(unique.entries());
  }, [entries]);

  const actionTypes = useMemo(() => {
    const unique = new Set<string>();
    for (const e of entries) {
      unique.add(e.action);
    }
    return Array.from(unique);
  }, [entries]);

  const filtered = useMemo(() => {
    return entries
      .filter(e => filterSystem === "all" || e.systemId === filterSystem)
      .filter(e => filterAction === "all" || e.action === filterAction)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [entries, filterSystem, filterAction]);

  return (
    <div className="border border-border/50 rounded bg-card/60 backdrop-blur-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
          <History className="h-3.5 w-3.5" />
          Revision History / Audit Trail
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-mono">{entries.length} entries</span>
          {onClear && entries.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Clear entire audit trail? This cannot be undone.")) {
                  onClear();
                }
              }}
              className="flex items-center gap-1 text-[10px] text-destructive hover:text-destructive/80 transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <select
            value={filterSystem}
            onChange={e => setFilterSystem(e.target.value)}
            className="bg-background border border-border rounded px-2 py-1 text-[10px] outline-none focus:border-primary"
          >
            <option value="all">All Systems</option>
            {systems.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="bg-background border border-border rounded px-2 py-1 text-[10px] outline-none focus:border-primary"
        >
          <option value="all">All Actions</option>
          {actionTypes.map(at => (
            <option key={at} value={at}>{getActionLabel(at as import("@/utils/auditTrail").AuditAction)}</option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      <div className="max-h-60 overflow-y-auto space-y-1">
        {filtered.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-4">No audit entries found.</p>
        ) : (
          filtered.slice(0, 100).map(entry => {
            const date = new Date(entry.timestamp);
            return (
              <div key={entry.id} className="flex items-start gap-2 text-[10px] py-1 border-b border-border/30 last:border-0">
                <span className="font-mono text-muted-foreground shrink-0 w-32">
                  {date.toLocaleDateString()} {date.toLocaleTimeString()}
                </span>
                <span className="font-semibold text-primary shrink-0 w-20 truncate">{entry.engineer}</span>
                <span className="font-mono text-muted-foreground shrink-0 w-28">{getActionLabel(entry.action as import("@/utils/auditTrail").AuditAction)}</span>
                <span className="text-foreground/70 truncate">{entry.systemName}: {entry.details}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
