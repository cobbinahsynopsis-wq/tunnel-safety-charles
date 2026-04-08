/**
 * Validation Warnings — flag incomplete FMEA rows, missing safety functions,
 * unverified hazard contexts.
 */

import type { SystemData, FMEARow } from "@/data/systems";
import type { HazardContext } from "./plrCalculation";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  severity: ValidationSeverity;
  systemId: string;
  systemName: string;
  category: string;
  message: string;
}

function validateFMEARow(row: FMEARow, systemId: string, systemName: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!row.component || row.component === "New Component") {
    issues.push({ severity: "warning", systemId, systemName, category: "FMEA", message: `Row "${row.id}": Component name is default/empty.` });
  }
  if (!row.failureMode || row.failureMode === "Failure mode") {
    issues.push({ severity: "warning", systemId, systemName, category: "FMEA", message: `Component "${row.component}": Failure mode is default.` });
  }
  if (!row.mitigation || row.mitigation === "Mitigation action") {
    issues.push({ severity: "error", systemId, systemName, category: "FMEA", message: `Component "${row.component}": Missing mitigation action.` });
  }
  if (row.rpn >= 200 && (!row.mitigation || row.mitigation === "Mitigation action")) {
    issues.push({ severity: "error", systemId, systemName, category: "FMEA", message: `Component "${row.component}": Critical RPN (${row.rpn}) with no mitigation.` });
  }

  return issues;
}

function validateHazardContext(ctx: HazardContext | undefined, systemId: string, systemName: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!ctx) {
    issues.push({ severity: "warning", systemId, systemName, category: "PLr", message: "Hazard context not configured. PLr using defaults." });
    return issues;
  }

  if (ctx.severityJustification.includes("UNVERIFIED")) {
    issues.push({ severity: "warning", systemId, systemName, category: "PLr", message: "Severity justification is UNVERIFIED." });
  }
  if (ctx.frequencyJustification.includes("UNVERIFIED")) {
    issues.push({ severity: "warning", systemId, systemName, category: "PLr", message: "Frequency justification is UNVERIFIED." });
  }
  if (ctx.avoidanceJustification.includes("UNVERIFIED")) {
    issues.push({ severity: "warning", systemId, systemName, category: "PLr", message: "Avoidance justification is UNVERIFIED." });
  }

  return issues;
}

export function validateSystem(system: SystemData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const id = system.id;
  const name = system.name;

  if (system.fmea.length === 0) {
    issues.push({ severity: "error", systemId: id, systemName: name, category: "FMEA", message: "No FMEA rows defined." });
  } else {
    for (const row of system.fmea) {
      issues.push(...validateFMEARow(row, id, name));
    }
  }

  if (system.safetyFunctions.length === 0) {
    issues.push({ severity: "warning", systemId: id, systemName: name, category: "Safety", message: "No safety functions defined." });
  }

  if (system.risks.length === 0) {
    issues.push({ severity: "warning", systemId: id, systemName: name, category: "Risk", message: "No risk entries in risk matrix." });
  }

  if (system.safetyMeasures.length === 0) {
    issues.push({ severity: "info", systemId: id, systemName: name, category: "Safety", message: "No safety measures documented." });
  }

  issues.push(...validateHazardContext(system.hazardContext, id, name));

  return issues;
}

export function validateAllSystems(systems: SystemData[]): ValidationIssue[] {
  return systems.flatMap(validateSystem);
}

export function getValidationSummary(issues: ValidationIssue[]): { errors: number; warnings: number; info: number } {
  return {
    errors: issues.filter(i => i.severity === "error").length,
    warnings: issues.filter(i => i.severity === "warning").length,
    info: issues.filter(i => i.severity === "info").length,
  };
}
