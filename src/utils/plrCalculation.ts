/**
 * ISO 13849-1:2023 PLr Determination Engine
 * 
 * PLr is determined ONLY from hazard context parameters (S, F, P)
 * per ISO 13849-1 Clause 4.3, Figure 3 — Risk graph.
 * 
 * FMEA data is used ONLY for post-determination validation (Clause 4.6).
 */

import type { FMEARow, FaultTreeNode } from "@/data/systems";

export type PLrLevel = "a" | "b" | "c" | "d" | "e";
export type SeverityClass = "S1" | "S2";
export type FrequencyClass = "F1" | "F2";
export type AvoidanceClass = "P1" | "P2";

export interface HazardContext {
  safetyFunction: string;
  hazard: string;
  severity: SeverityClass;
  severityJustification: string;
  frequency: FrequencyClass;
  frequencyJustification: string;
  avoidance: AvoidanceClass;
  avoidanceJustification: string;
}

export interface PLrResult {
  plr: PLrLevel;
  category: string;
  context: HazardContext;
  justification: string;
  isoReference: string;
  confidence: "High" | "Medium" | "Low";
  assumptions: string[];
}

export interface FMEAValidation {
  isConsistent: boolean;
  maxSeverity: number;
  avgOccurrence: number;
  avgDetection: number;
  maxRpn: number;
  findings: string[];
}

/**
 * ISO 13849-1:2023 Figure 3 — Risk graph for PLr determination.
 * Maps (S, F, P) to PLr strictly per the standard.
 */
export function determinePLr(s: SeverityClass, f: FrequencyClass, p: AvoidanceClass): PLrLevel {
  if (s === "S1" && f === "F1" && p === "P1") return "a";
  if (s === "S1" && f === "F1" && p === "P2") return "b";
  if (s === "S1" && f === "F2" && p === "P1") return "b";
  if (s === "S1" && f === "F2" && p === "P2") return "c";
  if (s === "S2" && f === "F1" && p === "P1") return "c";
  if (s === "S2" && f === "F1" && p === "P2") return "d";
  if (s === "S2" && f === "F2" && p === "P1") return "d";
  return "e"; // S2, F2, P2
}

/**
 * Map PLr to minimum safety category per ISO 13849-1.
 */
export function plrToCategory(plr: PLrLevel): string {
  const mapping: Record<PLrLevel, string> = {
    a: "B",
    b: "1",
    c: "2",
    d: "3",
    e: "4",
  };
  return mapping[plr];
}

/**
 * Generate ISO-compliant justification text.
 */
function generateJustification(ctx: HazardContext, plr: PLrLevel): string {
  return [
    `Safety Function: ${ctx.safetyFunction}.`,
    `Hazard: ${ctx.hazard}.`,
    `Severity (${ctx.severity}): ${ctx.severityJustification}`,
    `Frequency (${ctx.frequency}): ${ctx.frequencyJustification}`,
    `Avoidance (${ctx.avoidance}): ${ctx.avoidanceJustification}`,
    `Per ISO 13849-1:2023 Clause 4.3, Fig. 3: ${ctx.severity}+${ctx.frequency}+${ctx.avoidance} = PLr ${plr.toUpperCase()}, minimum Category ${plrToCategory(plr)}.`,
  ].join(" ");
}

/**
 * Validate FMEA data against the determined PLr (ISO 13849-1 Clause 4.6).
 * FMEA does NOT determine PLr — it validates design adequacy.
 */
export function validateWithFMEA(
  plr: PLrLevel,
  fmeaRows: ReadonlyArray<FMEARow>,
  faultTree?: FaultTreeNode
): FMEAValidation {
  if (fmeaRows.length === 0) {
    return {
      isConsistent: false,
      maxSeverity: 0,
      avgOccurrence: 0,
      avgDetection: 0,
      maxRpn: 0,
      findings: ["No FMEA data available for validation."],
    };
  }

  const maxSeverity = Math.max(...fmeaRows.map(r => r.severity));
  const avgOccurrence = fmeaRows.reduce((s, r) => s + r.occurrence, 0) / fmeaRows.length;
  const avgDetection = fmeaRows.reduce((s, r) => s + r.detection, 0) / fmeaRows.length;
  const maxRpn = Math.max(...fmeaRows.map(r => r.rpn));
  const findings: string[] = [];

  const plrIndex = ["a", "b", "c", "d", "e"].indexOf(plr);

  if (plrIndex >= 3 && maxSeverity < 5) {
    findings.push("WARNING: PLr indicates high risk but FMEA severity scores are low. Review hazard assessment or FMEA scores.");
  }
  if (plrIndex <= 1 && maxSeverity >= 8) {
    findings.push("WARNING: PLr indicates low risk but FMEA severity scores are high. Review hazard assessment.");
  }
  if (maxRpn > 200) {
    findings.push(`High RPN detected (max ${maxRpn}). Verify that mitigations are adequate for PLr ${plr.toUpperCase()}.`);
  }
  if (avgDetection > 7) {
    findings.push("Poor average detection capability. Consider additional diagnostic coverage per ISO 13849-1 Clause 4.5.3.");
  }

  if (faultTree) {
    const hasOr = checkOrGates(faultTree);
    if (hasOr && plrIndex >= 3) {
      findings.push("OR gates in fault tree indicate single-point failure paths. Ensure architecture meets Category " + plrToCategory(plr) + " requirements.");
    }
  }

  if (findings.length === 0) {
    findings.push("FMEA data is consistent with the determined PLr. No discrepancies found.");
  }

  return {
    isConsistent: findings.every(f => !f.startsWith("WARNING")),
    maxSeverity,
    avgOccurrence: Math.round(avgOccurrence * 10) / 10,
    avgDetection: Math.round(avgDetection * 10) / 10,
    maxRpn,
    findings,
  };
}

function checkOrGates(node: FaultTreeNode): boolean {
  if (node.gateType === "OR") return true;
  if (!node.children) return false;
  return node.children.some(checkOrGates);
}

/**
 * Calculate PLr for a system based on hazard context (NOT FMEA).
 */
export function calculatePLr(context: HazardContext): PLrResult {
  const plr = determinePLr(context.severity, context.frequency, context.avoidance);
  const category = plrToCategory(plr);
  const justification = generateJustification(context, plr);

  const assumptions: string[] = [];
  if (!context.severityJustification || context.severityJustification.includes("UNVERIFIED")) {
    assumptions.push("Severity classification requires field verification");
  }
  if (!context.frequencyJustification || context.frequencyJustification.includes("UNVERIFIED")) {
    assumptions.push("Frequency classification requires field verification");
  }
  if (!context.avoidanceJustification || context.avoidanceJustification.includes("UNVERIFIED")) {
    assumptions.push("Avoidance classification requires field verification");
  }

  const confidence: "High" | "Medium" | "Low" = assumptions.length === 0
    ? "High"
    : assumptions.length <= 1
      ? "Medium"
      : "Low";

  return {
    plr,
    category,
    context,
    justification,
    isoReference: "ISO 13849-1:2023, Clause 4.3, Figure 3 — Risk graph for determination of required performance level (PLr)",
    confidence,
    assumptions,
  };
}

/** Default hazard contexts for known systems */
export function getDefaultHazardContext(systemId: string): HazardContext {
  const defaults: Record<string, HazardContext> = {
    braking: {
      safetyFunction: "Emergency braking / Service brake monitoring",
      hazard: "Loss of braking - uncontrolled movement of TSP in tunnel",
      severity: "S2",
      severityJustification: "Uncontrolled movement of heavy tunnel machine (TSP >20t) can cause fatal crush injuries to personnel. Irreversible harm — S2 per ISO 13849-1 Clause 4.3.",
      frequency: "F2",
      frequencyJustification: "Operators and maintenance personnel are frequently present in the tunnel workspace during machine operation. Continuous exposure — F2.",
      avoidance: "P2",
      avoidanceJustification: "In case of brake failure on a slope, operator cannot react fast enough to avoid collision. Confined tunnel environment eliminates escape routes — P2.",
    },
    steering: {
      safetyFunction: "Steering position monitoring / Emergency steering",
      hazard: "Loss of steering - uncontrolled trajectory in tunnel",
      severity: "S2",
      severityJustification: "Uncontrolled lateral movement in confined tunnel can cause collision with infrastructure or personnel. Serious/fatal injury potential — S2.",
      frequency: "F2",
      frequencyJustification: "Steering is continuously active during TSP operation in shared tunnel workspace — F2.",
      avoidance: "P2",
      avoidanceJustification: "Steering failure at operating speed leaves insufficient time/space for avoidance in tunnel — P2.",
    },
    hydraulic: {
      safetyFunction: "Hydraulic pressure monitoring / Emergency shutdown",
      hazard: "Hydraulic system failure - loss of braking/steering actuators",
      severity: "S2",
      severityJustification: "Hydraulic failure can cascade to brake and steering loss, causing uncontrolled machine movement — S2.",
      frequency: "F2",
      frequencyJustification: "Hydraulic system operates continuously during all machine movement phases — F2.",
      avoidance: "P2",
      avoidanceJustification: "Sudden hydraulic loss provides no warning time for operator intervention — P2.",
    },
    electrical: {
      safetyFunction: "Electrical safety monitoring / Emergency stop",
      hazard: "Electrical failure - loss of control systems",
      severity: "S2",
      severityJustification: "Electrical failure can cause loss of safety-critical control functions including braking signals — S2.",
      frequency: "F2",
      frequencyJustification: "Electrical system is continuously energized during operation with personnel present — F2.",
      avoidance: "P1",
      avoidanceJustification: "Emergency stop circuits provide independent shutdown capability. Some electrical failures are detectable and avoidable — P1.",
    },
    propulsion: {
      safetyFunction: "Drive torque limitation / Overspeed protection",
      hazard: "Uncontrolled acceleration or overspeed in tunnel",
      severity: "S2",
      severityJustification: "Overspeed in tunnel environment can cause fatal collision — S2.",
      frequency: "F2",
      frequencyJustification: "Propulsion system operates continuously during tunnel transit with personnel exposure — F2.",
      avoidance: "P2",
      avoidanceJustification: "Operator reaction time insufficient to prevent collision at elevated speed in confined space — P2.",
    },
  };

  return defaults[systemId] ?? {
    safetyFunction: "Safety function to be defined",
    hazard: "Hazard to be identified",
    severity: "S2",
    severityJustification: "UNVERIFIED — Conservative assumption pending hazard analysis.",
    frequency: "F2",
    frequencyJustification: "UNVERIFIED — Conservative assumption pending exposure assessment.",
    avoidance: "P2",
    avoidanceJustification: "UNVERIFIED — Conservative assumption pending avoidance assessment.",
  };
}
