import { useSystems } from "@/context/SystemsContext";
import { User, Calendar, Clock, RotateCcw } from "lucide-react";

export function EngineerMetadata() {
  const { metadata, updateMetadata, resetToDefaults } = useSystems();

  const lastModDate = new Date(metadata.lastModified);
  const formattedTime = lastModDate.toLocaleString();

  return (
    <div className="border border-border/50 rounded bg-card/60 backdrop-blur-sm p-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
        <User className="h-3.5 w-3.5" />
        Analysis Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
            <User className="h-3 w-3 inline mr-1" />Engineer Name
          </label>
          <input
            value={metadata.engineerName}
            onChange={e => updateMetadata({ engineerName: e.target.value })}
            placeholder="Enter engineer name"
            className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
            <Calendar className="h-3 w-3 inline mr-1" />Analysis Date
          </label>
          <input
            type="date"
            value={metadata.date}
            onChange={e => updateMetadata({ date: e.target.value })}
            className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
            <Clock className="h-3 w-3 inline mr-1" />Last Modified
          </label>
          <div className="bg-muted/30 border border-border rounded px-2 py-1.5 text-xs font-mono text-muted-foreground">
            {formattedTime}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-3">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Notes</label>
          <input
            value={metadata.notes}
            onChange={e => updateMetadata({ notes: e.target.value })}
            placeholder="Analysis notes or comments"
            className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Reset all data to defaults? This cannot be undone.")) {
              resetToDefaults();
            }
          }}
          className="flex items-center gap-1 text-[10px] text-destructive hover:text-destructive/80 transition-colors mt-4"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>
    </div>
  );
}
