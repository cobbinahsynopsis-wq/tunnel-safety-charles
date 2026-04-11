/**
 * Audit Trail System — logs every change with timestamp + engineer name
 * for full ISO traceability.
 */

export interface AuditEntry {
  id: string;
  timestamp: string;
  engineer: string;
  action: AuditAction;
  systemId: string;
  systemName: string;
  details: string;
}

export type AuditAction =
  | "FMEA_ADD"
  | "FMEA_UPDATE"
  | "FMEA_DELETE"
  | "RISK_ADD"
  | "RISK_UPDATE"
  | "RISK_DELETE"
  | "SAFETY_FN_ADD"
  | "SAFETY_FN_UPDATE"
  | "SAFETY_FN_DELETE"
  | "FAULT_TREE_UPDATE"
  | "FAULT_TREE_ADD"
  | "FAULT_TREE_DELETE"
  | "SYSTEM_UPDATE"
  | "SYSTEM_ADD"
  | "SYSTEM_DELETE"
  | "HAZARD_CONTEXT_UPDATE"
  | "SAFETY_MEASURE_ADD"
  | "SAFETY_MEASURE_UPDATE"
  | "SAFETY_MEASURE_DELETE"
  | "CONSEQUENCE_ADD"
  | "CONSEQUENCE_UPDATE"
  | "CONSEQUENCE_DELETE"
  | "DATA_RESET"
  | "DATA_IMPORT"
  | "SYSTEM_SIGNOFF"
  | "SYSTEM_UNLOCK";

const AUDIT_STORAGE_KEY = "tsp-safety-audit-trail";
const MAX_ENTRIES = 500;

export function loadAuditTrail(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AuditEntry[];
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    /* ignore parse errors */
  }
  return [];
}

export function saveAuditTrail(entries: AuditEntry[]): void {
  const trimmed = entries.slice(-MAX_ENTRIES);
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(trimmed));
}

export function createAuditEntry(
  engineer: string,
  action: AuditAction,
  systemId: string,
  systemName: string,
  details: string
): AuditEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    engineer: engineer || "Unknown",
    action,
    systemId,
    systemName,
    details,
  };
}

export function clearAuditTrail(): void {
  localStorage.removeItem(AUDIT_STORAGE_KEY);
}

export function getActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    FMEA_ADD: "Added FMEA row",
    FMEA_UPDATE: "Updated FMEA row",
    FMEA_DELETE: "Deleted FMEA row",
    RISK_ADD: "Added risk entry",
    RISK_UPDATE: "Updated risk entry",
    RISK_DELETE: "Deleted risk entry",
    SAFETY_FN_ADD: "Added safety function",
    SAFETY_FN_UPDATE: "Updated safety function",
    SAFETY_FN_DELETE: "Deleted safety function",
    FAULT_TREE_UPDATE: "Updated fault tree node",
    FAULT_TREE_ADD: "Added fault tree node",
    FAULT_TREE_DELETE: "Deleted fault tree node",
    SYSTEM_UPDATE: "Updated system info",
    SYSTEM_ADD: "Added new system",
    SYSTEM_DELETE: "Deleted system",
    HAZARD_CONTEXT_UPDATE: "Updated hazard context",
    SAFETY_MEASURE_ADD: "Added safety measure",
    SAFETY_MEASURE_UPDATE: "Updated safety measure",
    SAFETY_MEASURE_DELETE: "Deleted safety measure",
    CONSEQUENCE_ADD: "Added consequence",
    CONSEQUENCE_UPDATE: "Updated consequence",
    CONSEQUENCE_DELETE: "Deleted consequence",
    DATA_RESET: "Reset all data",
    DATA_IMPORT: "Imported data",
    SYSTEM_SIGNOFF: "System signed off",
    SYSTEM_UNLOCK: "System unlocked",
  };
  return labels[action];
}
