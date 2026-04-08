/**
 * Backup / Restore — Export/import full project data as JSON.
 */

import type { SystemData } from "@/data/systems";
import type { AnalysisMetadata } from "@/context/SystemsContext";
import type { AuditEntry } from "./auditTrail";

export interface BackupData {
  version: number;
  exportedAt: string;
  exportedBy: string;
  metadata: AnalysisMetadata;
  systems: SystemData[];
  auditTrail: AuditEntry[];
}

const CURRENT_VERSION = 1;

export function createBackup(
  systems: SystemData[],
  metadata: AnalysisMetadata,
  auditTrail: AuditEntry[]
): BackupData {
  return {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    exportedBy: metadata.engineerName || "Unknown",
    metadata,
    systems,
    auditTrail,
  };
}

export function exportBackupAsJSON(backup: BackupData): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tsp-safety-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function validateBackup(data: unknown): data is BackupData {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;

  if (typeof obj.version !== "number") return false;
  if (typeof obj.exportedAt !== "string") return false;
  if (!obj.metadata || typeof obj.metadata !== "object") return false;
  if (!Array.isArray(obj.systems)) return false;

  const meta = obj.metadata as Record<string, unknown>;
  if (typeof meta.engineerName !== "string") return false;
  if (typeof meta.date !== "string") return false;

  for (const sys of obj.systems as unknown[]) {
    if (typeof sys !== "object" || sys === null) return false;
    const s = sys as Record<string, unknown>;
    if (typeof s.id !== "string") return false;
    if (typeof s.name !== "string") return false;
    if (!Array.isArray(s.fmea)) return false;
    if (!Array.isArray(s.risks)) return false;
  }

  return true;
}

export function readBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(reader.result as string);
        if (!validateBackup(parsed)) {
          reject(new Error("Invalid backup file format. Please select a valid TSP Safety backup JSON file."));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error("Failed to parse backup file. Ensure it is valid JSON."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}
