import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchRevisions, type RevisionRecord } from "@/utils/cloudSync";
import { History, FileClock, User, Clock, MessageSquare, ChevronDown, ChevronRight } from "lucide-react";

interface Props {
  systemId: string;
}

export function RevisionHistoryPanel({ systemId }: Props) {
  const [revisions, setRevisions] = useState<RevisionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await fetchRevisions(systemId);
    setRevisions(data);
    setLoading(false);
  }, [systemId]);

  useEffect(() => {
    reload();
    const channel = supabase
      .channel(`revisions-${systemId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "system_revisions", filter: `system_id=eq.${systemId}` },
        () => reload()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [systemId, reload]);

  return (
    <div className="border border-border/50 bg-card/60 rounded-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <FileClock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Revision &amp; Approval History</h3>
          <span className="text-[9px] font-mono px-2 py-0.5 bg-primary/10 text-primary rounded">
            ISO 13849 cl.10 / IEC 62061 cl.7.4
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {revisions.length} revision{revisions.length === 1 ? "" : "s"}
        </span>
      </div>

      {loading ? (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">Loading revisions…</div>
      ) : revisions.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">
          No revisions yet. A snapshot is created automatically when this subsystem is approved &amp; locked.
        </div>
      ) : (
        <ul className="divide-y divide-border/30">
          {revisions.map(rev => {
            const isOpen = expanded === rev.id;
            return (
              <li key={rev.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : rev.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/40 transition-colors"
                >
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="font-mono text-xs font-semibold text-primary w-16">{rev.revision_label}</span>
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <User className="h-3 w-3" />
                    {rev.created_by || "—"}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                    <Clock className="h-3 w-3" />
                    {new Date(rev.created_at).toLocaleString()}
                  </span>
                  <span className="ml-auto text-[9px] uppercase tracking-wider text-muted-foreground">
                    {rev.trigger === "signoff" ? "Sign-off snapshot" : "Manual"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-12 pb-3 pt-1 grid grid-cols-2 gap-3 text-[11px]">
                    {rev.comments && (
                      <div className="col-span-2 flex items-start gap-2 text-muted-foreground">
                        <MessageSquare className="h-3 w-3 mt-0.5 text-primary" />
                        <span className="text-foreground">{rev.comments}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">FMEA rows</span>
                      <span className="font-mono">{rev.snapshot.fmea?.length ?? 0}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Safety functions</span>
                      <span className="font-mono">{rev.snapshot.safetyFunctions?.length ?? 0}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Risk entries</span>
                      <span className="font-mono">{rev.snapshot.risks?.length ?? 0}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Locked</span>
                      <span className="font-mono">{rev.snapshot.signOff?.signedOff ? "Yes" : "No"}</span>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="px-4 py-2 border-t border-border/30 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <History className="h-3 w-3" />
        Snapshots are automatically created when an engineer approves &amp; locks the subsystem.
      </div>
    </div>
  );
}