import { useState } from "react";
import { useSystems } from "@/context/SystemsContext";
import type { SignOffRecord } from "@/data/systems";
import { Lock, Unlock, ShieldCheck, Clock, User, MessageSquare } from "lucide-react";

interface SignOffPanelProps {
  systemId: string;
  signOff?: SignOffRecord;
}

export function SignOffPanel({ systemId, signOff }: SignOffPanelProps) {
  const { metadata, signOffSystem, unlockSystem } = useSystems();
  const [comments, setComments] = useState("");
  const [unlockConfirm, setUnlockConfirm] = useState(false);

  const isLocked = signOff?.signedOff === true;
  const engineerName = metadata.engineerName;

  const handleSignOff = () => {
    if (!engineerName.trim()) return;
    signOffSystem(systemId, engineerName, comments.trim());
    setComments("");
  };

  const handleUnlock = () => {
    if (!unlockConfirm) {
      setUnlockConfirm(true);
      return;
    }
    unlockSystem(systemId, engineerName);
    setUnlockConfirm(false);
  };

  if (isLocked) {
    return (
      <div className="border border-primary/30 bg-primary/5 rounded-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-primary">Analysis Approved & Locked</h3>
                <Lock className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                All editing is disabled until this analysis is unlocked by an authorized engineer.
              </p>
            </div>
          </div>
          <div className="print-hide">
            {!unlockConfirm ? (
              <button
                onClick={handleUnlock}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-destructive/30 text-destructive rounded-sm text-xs font-medium hover:bg-destructive/10 transition-colors"
              >
                <Unlock className="h-3.5 w-3.5" />
                Unlock for Editing
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive">Are you sure?</span>
                <button
                  onClick={handleUnlock}
                  className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-sm text-xs font-medium hover:bg-destructive/90 transition-colors"
                >
                  Confirm Unlock
                </button>
                <button
                  onClick={() => setUnlockConfirm(false)}
                  className="px-3 py-1.5 border border-border rounded-sm text-xs font-medium hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sign-off details */}
        <div className="mt-3 pt-3 border-t border-primary/10 grid grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-3.5 w-3.5 text-primary" />
            <div>
              <span className="text-[9px] uppercase tracking-wider block">Approved By</span>
              <span className="font-medium text-foreground">{signOff.signedOffBy}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <div>
              <span className="text-[9px] uppercase tracking-wider block">Date & Time</span>
              <span className="font-mono text-foreground">
                {new Date(signOff.signedOffAt).toLocaleString()}
              </span>
            </div>
          </div>
          {signOff.comments && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5 text-primary mt-0.5" />
              <div>
                <span className="text-[9px] uppercase tracking-wider block">Comments</span>
                <span className="text-foreground">{signOff.comments}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border/50 bg-card/60 rounded-sm p-4 print-hide">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Engineer Sign-Off</h3>
          <p className="text-[10px] text-muted-foreground">
            Approve and lock this analysis to prevent further edits. Signing as: <span className="font-medium text-foreground">{engineerName || "—"}</span>
          </p>
        </div>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground block mb-1">Sign-off Comments (optional)</label>
          <textarea
            value={comments}
            onChange={e => setComments(e.target.value)}
            placeholder="e.g. Analysis reviewed and accepted per ISO 12100 requirements"
            className="w-full bg-background border border-border rounded-sm px-3 py-2 text-xs outline-none focus:border-primary resize-none h-16"
          />
        </div>
        <button
          onClick={handleSignOff}
          disabled={!engineerName.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-sm text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Lock className="h-3.5 w-3.5" />
          Approve & Lock
        </button>
      </div>
    </div>
  );
}
