import { useRef } from "react";
import { Download, Upload, Database } from "lucide-react";
import { useSystems } from "@/context/SystemsContext";
import { createBackup, exportBackupAsJSON, readBackupFile } from "@/utils/backupRestore";
import { loadAuditTrail } from "@/utils/auditTrail";
import { toast } from "@/hooks/use-toast";

export function BackupRestorePanel() {
  const { systems, metadata, importData } = useSystems();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const auditTrail = loadAuditTrail();
    const backup = createBackup(systems, metadata, auditTrail);
    exportBackupAsJSON(backup);
    toast({ title: "Backup exported", description: "Your data has been saved as JSON." });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const backup = await readBackupFile(file);
      if (window.confirm(`Import backup from ${backup.exportedBy} (${backup.exportedAt.split("T")[0]})? This will replace all current data.`)) {
        importData(backup.systems, backup.metadata);
        toast({ title: "Data imported", description: `Restored ${backup.systems.length} systems from backup.` });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to import file.";
      toast({ title: "Import failed", description: message, variant: "destructive" });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border border-border/50 rounded bg-card/60 backdrop-blur-sm p-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
        <Database className="h-3.5 w-3.5" />
        Data Backup / Restore
      </h3>
      <p className="text-[10px] text-muted-foreground">
        Export your entire project (all systems, FMEA, risk data, audit trail) as a JSON file for backup.
        Import a previous backup to restore data.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-sm text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export Backup (JSON)
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-card text-foreground rounded-sm text-xs font-medium hover:bg-accent transition-colors"
        >
          <Upload className="h-3.5 w-3.5" />
          Import Backup
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </div>
    </div>
  );
}
