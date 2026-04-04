import type { FMEARow, FaultTreeNode } from "@/data/systems";

type PLrLevel = "a" | "b" | "c" | "d" | "e";

interface PLrResult {
  plr: PLrLevel;
  category: string;
  severityClass: "S1" | "S2";
  frequency: "F1" | "F2";
  avoidance: "P1" | "P2";
  justification: string;
  isoReference: string;
}

/**
 * Count total basic events (leaf nodes) in a fault tree.
 */
function countBasicEvents(node: FaultTreeNode): number {
  if (!node.children || node.children.length === 0) return 1;
  return node.children.reduce((sum, child) => sum + countBasicEvents(child), 0);
}

/**
 * Get maximum tree depth.
 */
function getTreeDepth(node: FaultTreeNode): number {
  if (!node.children || node.children.length === 0) return 1;
  return 1 + Math.max(...node.children.map(getTreeDepth));
}

/**
 * Check if tree contains any OR gates (single point of failure paths).
 */
function hasOrGates(node: FaultTreeNode): boolean {
  if (node.gateType === "OR") return true;
  if (!node.children) return false;
  return node.children.some(hasOrGates);
}

/**
 * Determine severity class per ISO 13849-1 Table 3.
 * S1 = slight (reversible) injury, S2 = serious (irreversible) injury or death.
 */
function determineSeverityClass(fmeaRows: ReadonlyArray<FMEARow>): "S1" | "S2" {
  const maxSeverity = fmeaRows.length > 0
    ? Math.max(...fmeaRows.map(r => r.severity))
    : 1;
  return maxSeverity >= 7 ? "S2" : "S1";
}

/**
 * Determine frequency/exposure class per ISO 13849-1.
 * F1 = seldom to less often, F2 = frequent to continuous.
 */
function determineFrequency(fmeaRows: ReadonlyArray<FMEARow>): "F1" | "F2" {
  const avgOccurrence = fmeaRows.length > 0
    ? fmeaRows.reduce((sum, r) => sum + r.occurrence, 0) / fmeaRows.length
    : 1;
  return avgOccurrence >= 5 ? "F2" : "F1";
}

/**
 * Determine possibility of avoidance per ISO 13849-1.
 * P1 = possible under specific conditions, P2 = scarcely possible.
 */
function determineAvoidance(
  fmeaRows: ReadonlyArray<FMEARow>,
  faultTree: FaultTreeNode
): "P1" | "P2" {
  const avgDetection = fmeaRows.length > 0
    ? fmeaRows.reduce((sum, r) => sum + r.detection, 0) / fmeaRows.length
    : 1;
  const orGatesPresent = hasOrGates(faultTree);
  // Poor detection or OR gates (single failure paths) = hard to avoid
  return (avgDetection >= 6 || orGatesPresent) ? "P2" : "P1";
}

/**
 * ISO 13849-1 Figure 3 — Risk graph for PLr determination.
 */
function determinePLrFromRiskGraph(s: "S1" | "S2", f: "F1" | "F2", p: "P1" | "P2"): PLrLevel {
  if (s === "S1" && f === "F1") return "a";
  if (s === "S1" && f === "F2" && p === "P1") return "a";
  if (s === "S1" && f === "F2" && p === "P2") return "b";
  if (s === "S2" && f === "F1" && p === "P1") return "b";
  if (s === "S2" && f === "F1" && p === "P2") return "c";
  if (s === "S2" && f === "F2" && p === "P1") return "d";
  return "e"; // S2, F2, P2
}

/**
 * Map PLr to minimum safety category per ISO 13849-1.
 */
function plrToCategory(plr: PLrLevel): string {
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
 * Generate justification text.
 */
function generateJustification(
  s: "S1" | "S2",
  f: "F1" | "F2",
  p: "P1" | "P2",
  plr: PLrLevel,
  fmeaRows: ReadonlyArray<FMEARow>,
  faultTree: FaultTreeNode
): string {
  const maxSev = fmeaRows.length > 0 ? Math.max(...fmeaRows.map(r => r.severity)) : 0;
  const avgOcc = fmeaRows.length > 0
    ? (fmeaRows.reduce((sum, r) => sum + r.occurrence, 0) / fmeaRows.length).toFixed(1)
    : "0";
  const avgDet = fmeaRows.length > 0
    ? (fmeaRows.reduce((sum, r) => sum + r.detection, 0) / fmeaRows.length).toFixed(1)
    : "0";
  const basicEvents = countBasicEvents(faultTree);
  const treeDepth = getTreeDepth(faultTree);
  const orGates = hasOrGates(faultTree);

  const sevReason = s === "S2"
    ? `Severity ${s}: Max FMEA severity is ${maxSev}/10 (≥7), indicating serious/irreversible injury potential.`
    : `Severity ${s}: Max FMEA severity is ${maxSev}/10 (<7), indicating slight/reversible injury.`;

  const freqReason = f === "F2"
    ? `Frequency ${f}: Avg occurrence is ${avgOcc}/10 (≥5), indicating frequent exposure.`
    : `Frequency ${f}: Avg occurrence is ${avgOcc}/10 (<5), indicating infrequent exposure.`;

  const avoidReason = p === "P2"
    ? `Avoidance ${p}: Avg detection is ${avgDet}/10${orGates ? " and OR gates present in fault tree" : ""}, making hazard avoidance scarcely possible.`
    : `Avoidance ${p}: Avg detection is ${avgDet}/10 with redundant paths, making hazard avoidance possible.`;

  const treeSummary = `Fault tree: ${basicEvents} basic events, depth ${treeDepth}${orGates ? ", contains OR gates (single-point failure paths)" : ", AND gates provide redundancy"}.`;

  return `${sevReason} ${freqReason} ${avoidReason} ${treeSummary} Per ISO 13849-1 risk graph: ${s}+${f}+${p} → PLr = ${plr.toUpperCase()}, minimum Category ${plrToCategory(plr)}.`;
}

/**
 * Calculate PLr for a system based on its FMEA data and fault tree.
 */
export function calculatePLr(
  fmeaRows: ReadonlyArray<FMEARow>,
  faultTree: FaultTreeNode
): PLrResult {
  const severityClass = determineSeverityClass(fmeaRows);
  const frequency = determineFrequency(fmeaRows);
  const avoidance = determineAvoidance(fmeaRows, faultTree);
  const plr = determinePLrFromRiskGraph(severityClass, frequency, avoidance);
  const category = plrToCategory(plr);
  const justification = generateJustification(severityClass, frequency, avoidance, plr, fmeaRows, faultTree);

  return {
    plr,
    category,
    severityClass,
    frequency,
    avoidance,
    justification,
    isoReference: "ISO 13849-1:2023, Clause 4.3, Figure 3 — Risk graph for determination of required performance level (PLr)",
  };
}
