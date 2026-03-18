import * as XLSX from "xlsx";
import { systems, machineInfo } from "@/data/systems";
import type { SystemData, FaultTreeNode, FMEARow } from "@/data/systems";

function flattenTree(node: FaultTreeNode, depth = 0, rows: any[] = []): any[] {
  const indent = "  ".repeat(depth);
  rows.push({
    Level: depth,
    Code: node.code || "TOP",
    Gate: node.gateType || "",
    Type: node.type,
    Description: indent + node.label,
  });
  if (node.children) {
    node.children.forEach((c) => flattenTree(c, depth + 1, rows));
  }
  return rows;
}

function riskLevelFromScore(s: number, p: number): string {
  const score = s * p;
  if (score >= 16) return "CRITICAL";
  if (score >= 9) return "HIGH";
  if (score >= 4) return "MEDIUM";
  return "LOW";
}

function rpnLevelStr(rpn: number): string {
  if (rpn >= 40) return "CRITICAL";
  if (rpn >= 25) return "HIGH";
  if (rpn >= 15) return "MEDIUM";
  return "LOW";
}

function setColumnWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws["!cols"] = widths.map((w) => ({ wch: w }));
}

function addHeaderStyle(ws: XLSX.WorkSheet) {
  // xlsx community doesn't support styles, but we set column widths for readability
  return ws;
}

export function generateExcelWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // ===== DASHBOARD SHEET =====
  const dashData: any[][] = [
    ["TSP TUNNEL TRANSPORT VEHICLE - RISK ANALYSIS DASHBOARD"],
    ["ISO 12100 Risk Assessment & ISO 13849 Performance Level Evaluation"],
    [],
    ["MACHINE SPECIFICATIONS"],
    ["Parameter", "Value"],
    ["Name", machineInfo.name],
    ["Application", machineInfo.application],
    ["Load Capacity", machineInfo.loadCapacity],
    ["Propulsion", machineInfo.propulsion],
    ["Configuration", machineInfo.axles],
    ["Operator Cabins", machineInfo.cabins],
    ["Traction", machineInfo.tractionSystem],
    ["Braking", machineInfo.brakingSystems],
    ["Steering", machineInfo.steering],
    ["Guidance", machineInfo.guidance],
    ["Fire Protection", machineInfo.fireProtection],
    ["Standards", machineInfo.standards.join(", ")],
    [],
    ["SUMMARY STATISTICS"],
    ["Metric", "Value"],
    ["Total Systems", systems.length],
    ["Total FMEA Items", systems.reduce((a, s) => a + s.fmea.length, 0)],
    ["Total Risks", systems.reduce((a, s) => a + s.risks.length, 0)],
    ["Critical Risks", systems.reduce((a, s) => a + s.risks.filter((r) => r.riskLevel === "critical").length, 0)],
    ["High Risks", systems.reduce((a, s) => a + s.risks.filter((r) => r.riskLevel === "high").length, 0)],
    ["Max RPN", Math.max(...systems.flatMap((s) => s.fmea.map((f) => f.rpn)))],
    ["Total Safety Functions", systems.reduce((a, s) => a + s.safetyFunctions.length, 0)],
    [],
    ["SYSTEM OVERVIEW"],
    ["System", "French Name", "FMEA Items", "Risks", "Critical", "High", "Max RPN", "Safety Functions"],
    ...systems.map((s) => [
      s.name,
      s.nameFr,
      s.fmea.length,
      s.risks.length,
      s.risks.filter((r) => r.riskLevel === "critical").length,
      s.risks.filter((r) => r.riskLevel === "high").length,
      s.fmea.length > 0 ? Math.max(...s.fmea.map((f) => f.rpn)) : 0,
      s.safetyFunctions.length,
    ]),
  ];

  const wsDash = XLSX.utils.aoa_to_sheet(dashData);
  setColumnWidths(wsDash, [25, 20, 12, 10, 10, 10, 10, 16]);
  XLSX.utils.book_append_sheet(wb, wsDash, "Dashboard");

  // ===== PER-SYSTEM SHEETS =====
  systems.forEach((sys) => {
    // FMEA Sheet
    const fmeaHeader = [
      "ID", "Component", "Failure Mode", "Cause", "Effect",
      "Severity (S)", "Occurrence (O)", "Detection (D)",
      "RPN (S×O×D)", "Risk Level", "Mitigation",
    ];
    const fmeaRows = sys.fmea.map((f, i) => [
      i + 1, f.component, f.failureMode, f.cause, f.effect,
      f.severity, f.occurrence, f.detection,
      f.rpn, rpnLevelStr(f.rpn), f.mitigation,
    ]);
    // Add 5 empty editable rows
    for (let i = 0; i < 5; i++) {
      const row = sys.fmea.length + i + 2; // 1-indexed + header
      fmeaRows.push([
        sys.fmea.length + i + 1, "", "", "", "",
        "", "", "", `=F${row + 1}*G${row + 1}*H${row + 1}`,
        `=IF(I${row + 1}>=40,"CRITICAL",IF(I${row + 1}>=25,"HIGH",IF(I${row + 1}>=15,"MEDIUM","LOW")))`,
        "",
      ]);
    }

    const wsFmea = XLSX.utils.aoa_to_sheet([
      [`${sys.name} (${sys.nameFr}) - FMEA ANALYSIS`],
      [`Top Event: ${sys.topEvent}`],
      [],
      fmeaHeader,
      ...fmeaRows,
    ]);
    setColumnWidths(wsFmea, [5, 25, 22, 22, 25, 12, 12, 12, 14, 12, 35]);
    const shortName = sys.nameFr.substring(0, 12);
    XLSX.utils.book_append_sheet(wb, wsFmea, `${shortName} FMEA`);

    // Fault Tree Sheet
    const treeRows = flattenTree(sys.faultTree);
    const wsTree = XLSX.utils.json_to_sheet(treeRows);
    setColumnWidths(wsTree, [8, 10, 8, 10, 60]);
    XLSX.utils.book_append_sheet(wb, wsTree, `${shortName} FTA`);

    // Risk Matrix Sheet
    const riskHeader = ["ID", "Hazard", "Severity", "Probability", "Score", "Risk Level"];
    const riskRows = sys.risks.map((r, i) => [
      i + 1, r.hazard, r.severity, r.probability,
      r.severity * r.probability, r.riskLevel.toUpperCase(),
    ]);
    // Add empty editable rows with formulas
    for (let i = 0; i < 5; i++) {
      const row = sys.risks.length + i + 2;
      riskRows.push([
        sys.risks.length + i + 1, "", "", "",
        `=C${row + 1}*D${row + 1}`,
        `=IF(E${row + 1}>=16,"CRITICAL",IF(E${row + 1}>=9,"HIGH",IF(E${row + 1}>=4,"MEDIUM","LOW")))`,
      ]);
    }

    const riskData: any[][] = [
      [`${sys.name} - RISK MATRIX`],
      [],
      riskHeader,
      ...riskRows,
      [],
      ["5×5 RISK HEATMAP"],
      ["Sev\\Prob", 1, 2, 3, 4, 5],
    ];

    for (let s = 5; s >= 1; s--) {
      const heatRow: any[] = [s];
      for (let p = 1; p <= 5; p++) {
        const count = sys.risks.filter((r) => r.severity === s && r.probability === p).length;
        heatRow.push(count > 0 ? `${riskLevelFromScore(s, p)} (${count})` : riskLevelFromScore(s, p));
      }
      riskData.push(heatRow);
    }

    const wsRisk = XLSX.utils.aoa_to_sheet(riskData);
    setColumnWidths(wsRisk, [12, 40, 12, 12, 12, 14]);
    XLSX.utils.book_append_sheet(wb, wsRisk, `${shortName} Risk`);

    // Safety Functions Sheet
    const sfHeader = ["ID", "Function", "PLr", "Category", "Description"];
    const sfRows = sys.safetyFunctions.map((sf, i) => [
      i + 1, sf.function, sf.plr, sf.category, sf.description,
    ]);
    const wsSf = XLSX.utils.aoa_to_sheet([
      [`${sys.name} - SAFETY FUNCTIONS (ISO 13849)`],
      [],
      sfHeader,
      ...sfRows,
      [],
      ["CONSEQUENCES"],
      ...sys.consequences.map((c, i) => [i + 1, c]),
      [],
      ["SAFETY MEASURES"],
      ...sys.safetyMeasures.map((m, i) => [i + 1, m]),
    ]);
    setColumnWidths(wsSf, [5, 35, 8, 10, 50]);
    XLSX.utils.book_append_sheet(wb, wsSf, `${shortName} Safety`);
  });

  // ===== INSTRUCTIONS SHEET =====
  const instrData = [
    ["TSP RISK ANALYSIS - USER GUIDE"],
    [],
    ["HOW TO USE THIS WORKBOOK"],
    [],
    ["1. FMEA Sheets"],
    ["   - Each system has its own FMEA sheet with all failure modes"],
    ["   - Yellow rows at the bottom are empty for you to add new entries"],
    ["   - Change S, O, D values (1-5) and RPN calculates automatically"],
    ["   - Risk Level updates automatically based on RPN"],
    [],
    ["2. Fault Tree (FTA) Sheets"],
    ["   - Shows the hierarchical failure tree for each system"],
    ["   - Level column shows the depth in the tree"],
    ["   - Gate types: OR = any child causes failure, AND = all children needed"],
    [],
    ["3. Risk Matrix Sheets"],
    ["   - Risk entries with severity × probability scoring"],
    ["   - Includes 5×5 heatmap showing risk distribution"],
    ["   - Add new risks in the empty rows - Score and Level auto-calculate"],
    [],
    ["4. Safety Functions Sheets"],
    ["   - ISO 13849 safety functions with PLr and Category"],
    ["   - Includes consequences and safety measures"],
    [],
    ["RISK LEVEL SCALE"],
    ["RPN ≥ 40", "CRITICAL"],
    ["RPN 25-39", "HIGH"],
    ["RPN 15-24", "MEDIUM"],
    ["RPN < 15", "LOW"],
    [],
    ["SEVERITY / PROBABILITY SCALE"],
    ["Score ≥ 16", "CRITICAL"],
    ["Score 9-15", "HIGH"],
    ["Score 4-8", "MEDIUM"],
    ["Score < 4", "LOW"],
  ];
  const wsInstr = XLSX.utils.aoa_to_sheet(instrData);
  setColumnWidths(wsInstr, [50, 20]);
  XLSX.utils.book_append_sheet(wb, wsInstr, "Instructions");

  return wb;
}

export function downloadExcel() {
  const wb = generateExcelWorkbook();
  XLSX.writeFile(wb, "TSP_Risk_Analysis.xlsx");
}
