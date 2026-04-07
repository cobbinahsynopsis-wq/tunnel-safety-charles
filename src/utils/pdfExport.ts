import type { SystemData } from "@/data/systems";
import type { HazardContext } from "@/utils/plrCalculation";
import { determinePLr, plrToCategory } from "@/utils/plrCalculation";
import type { AnalysisMetadata } from "@/context/SystemsContext";

function rpnLevel(rpn: number): string {
  if (rpn >= 200) return "CRITICAL";
  if (rpn >= 120) return "HIGH";
  if (rpn >= 80) return "MEDIUM";
  return "LOW";
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function exportOverviewPDF(systems: SystemData[], metadata: AnalysisMetadata): void {
  const totalFMEA = systems.reduce((acc, s) => acc + s.fmea.length, 0);
  const criticalRisks = systems.reduce((acc, s) => acc + s.risks.filter(r => r.riskLevel === "critical").length, 0);
  const highRisks = systems.reduce((acc, s) => acc + s.risks.filter(r => r.riskLevel === "high").length, 0);
  const maxRpn = Math.max(...systems.flatMap(s => s.fmea.map(f => f.rpn)), 0);
  const avgRpn = totalFMEA > 0 ? Math.round(systems.reduce((acc, s) => acc + s.fmea.reduce((a, f) => a + f.rpn, 0), 0) / totalFMEA) : 0;

  const systemSections = systems.map(system => {
    const sysMaxRpn = system.fmea.length > 0 ? Math.max(...system.fmea.map(f => f.rpn)) : 0;
    const sysCritical = system.risks.filter(r => r.riskLevel === "critical").length;

    const fmeaRows = system.fmea
      .sort((a, b) => b.rpn - a.rpn)
      .slice(0, 10)
      .map(row => `
        <tr>
          <td style="padding:4px 8px;border:1px solid #333;font-size:10px">${escapeHtml(row.component)}</td>
          <td style="padding:4px 8px;border:1px solid #333;font-size:10px">${escapeHtml(row.failureMode)}</td>
          <td style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:center">${row.severity}</td>
          <td style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:center">${row.occurrence}</td>
          <td style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:center">${row.detection}</td>
          <td style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:center;font-weight:bold">${row.rpn}</td>
          <td style="padding:4px 8px;border:1px solid #333;font-size:10px">${rpnLevel(row.rpn)}</td>
          <td style="padding:4px 8px;border:1px solid #333;font-size:10px">${escapeHtml(row.mitigation)}</td>
        </tr>
      `).join("");

    const safetyRows = system.safetyFunctions.map(sf => `
      <tr>
        <td style="padding:4px 8px;border:1px solid #333;font-size:10px">${escapeHtml(sf.function)}</td>
        <td style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:center;font-weight:bold">${sf.plr.toUpperCase()}</td>
        <td style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:center">${sf.category}</td>
        <td style="padding:4px 8px;border:1px solid #333;font-size:10px">${escapeHtml(sf.description)}</td>
      </tr>
    `).join("");

    return `
      <div style="page-break-before:always;margin-top:20px">
        <h2 style="color:#f97316;font-size:16px;margin-bottom:4px">${escapeHtml(system.name)} (${escapeHtml(system.nameFr)})</h2>
        <p style="font-size:10px;color:#888;margin-bottom:8px">${escapeHtml(system.description)}</p>
        <div style="display:flex;gap:16px;margin-bottom:12px">
          <div style="padding:8px 12px;background:#1a1a2e;border:1px solid #333;border-radius:4px">
            <span style="font-size:9px;color:#888">MAX RPN</span><br/>
            <span style="font-size:18px;font-weight:bold;color:#f97316">${sysMaxRpn}</span>
          </div>
          <div style="padding:8px 12px;background:#1a1a2e;border:1px solid #333;border-radius:4px">
            <span style="font-size:9px;color:#888">CRITICAL</span><br/>
            <span style="font-size:18px;font-weight:bold;color:#ef4444">${sysCritical}</span>
          </div>
          <div style="padding:8px 12px;background:#1a1a2e;border:1px solid #333;border-radius:4px">
            <span style="font-size:9px;color:#888">FMEA ITEMS</span><br/>
            <span style="font-size:18px;font-weight:bold">${system.fmea.length}</span>
          </div>
          <div style="padding:8px 12px;background:#1a1a2e;border:1px solid #333;border-radius:4px">
            <span style="font-size:9px;color:#888">SAFETY FN</span><br/>
            <span style="font-size:18px;font-weight:bold">${system.safetyFunctions.length}</span>
          </div>
        </div>
        ${system.fmea.length > 0 ? `
          <h3 style="font-size:12px;color:#f97316;margin-bottom:6px">FMEA Analysis (Top ${Math.min(10, system.fmea.length)})</h3>
          <table style="width:100%;border-collapse:collapse;margin-bottom:12px">
            <thead>
              <tr style="background:#1a1a2e">
                <th style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:left">Component</th>
                <th style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:left">Failure Mode</th>
                <th style="padding:4px 8px;border:1px solid #333;font-size:10px">S</th>
                <th style="padding:4px 8px;border:1px solid #333;font-size:10px">O</th>
                <th style="padding:4px 8px;border:1px solid #333;font-size:10px">D</th>
                <th style="padding:4px 8px;border:1px solid #333;font-size:10px">RPN</th>
                <th style="padding:4px 8px;border:1px solid #333;font-size:10px">Risk</th>
                <th style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:left">Mitigation</th>
              </tr>
            </thead>
            <tbody>${fmeaRows}</tbody>
          </table>
        ` : ""}
        ${system.safetyFunctions.length > 0 ? `
          <h3 style="font-size:12px;color:#f97316;margin-bottom:6px">Safety Functions (ISO 13849)</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#1a1a2e">
                <th style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:left">Function</th>
                <th style="padding:4px 8px;border:1px solid #333;font-size:10px">PLr</th>
                <th style="padding:4px 8px;border:1px solid #333;font-size:10px">Cat.</th>
                <th style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:left">Description</th>
              </tr>
            </thead>
            <tbody>${safetyRows}</tbody>
          </table>
        ` : ""}
      </div>
    `;
  }).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>TSP/MSV Safety Analysis Report</title>
      <style>
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        body { font-family: Arial, Helvetica, sans-serif; background: #0f0f1a; color: #e0e0e0; margin: 0; padding: 24px; }
        @page { size: A4 landscape; margin: 12mm; }
      </style>
    </head>
    <body>
      <div style="border-bottom:2px solid #f97316;padding-bottom:12px;margin-bottom:16px">
        <h1 style="color:#f97316;font-size:22px;margin:0">TSP/MSV Safety Analysis Report</h1>
        <div style="display:flex;gap:24px;margin-top:8px;font-size:11px;color:#888">
          <span>Engineer: <strong style="color:#e0e0e0">${escapeHtml(metadata.engineerName || "Not specified")}</strong></span>
          <span>Date: <strong style="color:#e0e0e0">${metadata.date}</strong></span>
          <span>Generated: <strong style="color:#e0e0e0">${new Date().toLocaleString()}</strong></span>
        </div>
        ${metadata.notes ? `<p style="font-size:10px;color:#888;margin-top:4px">Notes: ${escapeHtml(metadata.notes)}</p>` : ""}
      </div>

      <h2 style="color:#f97316;font-size:14px;margin-bottom:8px">Executive Summary</h2>
      <div style="display:flex;gap:16px;margin-bottom:16px">
        <div style="padding:12px 16px;background:#1a1a2e;border:1px solid #333;border-radius:4px;flex:1">
          <span style="font-size:9px;color:#888;text-transform:uppercase">Total Failure Modes</span><br/>
          <span style="font-size:24px;font-weight:bold">${totalFMEA}</span>
        </div>
        <div style="padding:12px 16px;background:#1a1a2e;border:1px solid #f43f5e30;border-radius:4px;flex:1">
          <span style="font-size:9px;color:#888;text-transform:uppercase">Critical Risks</span><br/>
          <span style="font-size:24px;font-weight:bold;color:#ef4444">${criticalRisks}</span>
        </div>
        <div style="padding:12px 16px;background:#1a1a2e;border:1px solid #f9731630;border-radius:4px;flex:1">
          <span style="font-size:9px;color:#888;text-transform:uppercase">High Risks</span><br/>
          <span style="font-size:24px;font-weight:bold;color:#f97316">${highRisks}</span>
        </div>
        <div style="padding:12px 16px;background:#1a1a2e;border:1px solid #333;border-radius:4px;flex:1">
          <span style="font-size:9px;color:#888;text-transform:uppercase">Max RPN</span><br/>
          <span style="font-size:24px;font-weight:bold;color:#f97316">${maxRpn}</span>
        </div>
        <div style="padding:12px 16px;background:#1a1a2e;border:1px solid #333;border-radius:4px;flex:1">
          <span style="font-size:9px;color:#888;text-transform:uppercase">Avg RPN</span><br/>
          <span style="font-size:24px;font-weight:bold">${avgRpn}</span>
        </div>
        <div style="padding:12px 16px;background:#1a1a2e;border:1px solid #333;border-radius:4px;flex:1">
          <span style="font-size:9px;color:#888;text-transform:uppercase">Subsystems</span><br/>
          <span style="font-size:24px;font-weight:bold">${systems.length}</span>
        </div>
      </div>

      ${systemSections}

      <div style="margin-top:32px;padding-top:12px;border-top:1px solid #333;font-size:9px;color:#666;text-align:center">
        TSP/MSV Safety Analysis Report — ISO 12100 / ISO 13849 — Generated ${new Date().toISOString().split("T")[0]}
        ${metadata.engineerName ? ` — Prepared by ${escapeHtml(metadata.engineerName)}` : ""}
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

export function exportSystemPDF(system: SystemData, metadata: AnalysisMetadata, hazardContext?: HazardContext): void {
  const sysMaxRpn = system.fmea.length > 0 ? Math.max(...system.fmea.map(f => f.rpn)) : 0;
  const sysCritical = system.risks.filter(r => r.riskLevel === "critical").length;
  const sysHigh = system.risks.filter(r => r.riskLevel === "high").length;

  const fmeaRows = system.fmea
    .sort((a, b) => b.rpn - a.rpn)
    .map(row => `
      <tr>
        <td style="padding:4px 8px;border:1px solid #333;font-size:10px">${escapeHtml(row.component)}</td>
        <td style="padding:4px 8px;border:1px solid #333;font-size:10px">${escapeHtml(row.failureMode)}</td>
        <td style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:center">${row.severity}</td>
        <td style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:center">${row.occurrence}</td>
        <td style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:center">${row.detection}</td>
        <td style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:center;font-weight:bold">${row.rpn}</td>
        <td style="padding:4px 8px;border:1px solid #333;font-size:10px">${rpnLevel(row.rpn)}</td>
        <td style="padding:4px 8px;border:1px solid #333;font-size:10px">${escapeHtml(row.mitigation)}</td>
      </tr>
    `).join("");

  const safetyRows = system.safetyFunctions.map(sf => `
    <tr>
      <td style="padding:4px 8px;border:1px solid #333;font-size:10px">${escapeHtml(sf.function)}</td>
      <td style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:center;font-weight:bold">${sf.plr.toUpperCase()}</td>
      <td style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:center">${sf.category}</td>
      <td style="padding:4px 8px;border:1px solid #333;font-size:10px">${escapeHtml(sf.description)}</td>
    </tr>
  `).join("");

  let plrSection = "";
  if (hazardContext) {
    const plr = determinePLr(hazardContext.severity, hazardContext.frequency, hazardContext.avoidance);
    const cat = plrToCategory(plr);
    plrSection = `
      <h3 style="font-size:12px;color:#f97316;margin-top:16px;margin-bottom:6px">PLr Determination (ISO 13849-1 Clause 4.3)</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px">
        <tr>
          <td style="padding:6px 10px;border:1px solid #333;font-size:10px;background:#1a1a2e;width:25%"><strong>Safety Function</strong></td>
          <td style="padding:6px 10px;border:1px solid #333;font-size:10px" colspan="3">${escapeHtml(hazardContext.safetyFunction)}</td>
        </tr>
        <tr>
          <td style="padding:6px 10px;border:1px solid #333;font-size:10px;background:#1a1a2e"><strong>Hazard</strong></td>
          <td style="padding:6px 10px;border:1px solid #333;font-size:10px" colspan="3">${escapeHtml(hazardContext.hazard)}</td>
        </tr>
        <tr>
          <td style="padding:6px 10px;border:1px solid #333;font-size:10px;background:#1a1a2e"><strong>Severity</strong></td>
          <td style="padding:6px 10px;border:1px solid #333;font-size:10px">${hazardContext.severity}</td>
          <td style="padding:6px 10px;border:1px solid #333;font-size:10px;background:#1a1a2e"><strong>Justification</strong></td>
          <td style="padding:6px 10px;border:1px solid #333;font-size:10px">${escapeHtml(hazardContext.severityJustification)}</td>
        </tr>
        <tr>
          <td style="padding:6px 10px;border:1px solid #333;font-size:10px;background:#1a1a2e"><strong>Frequency</strong></td>
          <td style="padding:6px 10px;border:1px solid #333;font-size:10px">${hazardContext.frequency}</td>
          <td style="padding:6px 10px;border:1px solid #333;font-size:10px;background:#1a1a2e"><strong>Justification</strong></td>
          <td style="padding:6px 10px;border:1px solid #333;font-size:10px">${escapeHtml(hazardContext.frequencyJustification)}</td>
        </tr>
        <tr>
          <td style="padding:6px 10px;border:1px solid #333;font-size:10px;background:#1a1a2e"><strong>Avoidance</strong></td>
          <td style="padding:6px 10px;border:1px solid #333;font-size:10px">${hazardContext.avoidance}</td>
          <td style="padding:6px 10px;border:1px solid #333;font-size:10px;background:#1a1a2e"><strong>Justification</strong></td>
          <td style="padding:6px 10px;border:1px solid #333;font-size:10px">${escapeHtml(hazardContext.avoidanceJustification)}</td>
        </tr>
        <tr style="background:#1a1a2e">
          <td style="padding:8px 10px;border:1px solid #333;font-size:12px" colspan="2"><strong>Result: PLr = ${plr.toUpperCase()}</strong></td>
          <td style="padding:8px 10px;border:1px solid #333;font-size:12px" colspan="2"><strong>Minimum Category: ${cat}</strong></td>
        </tr>
      </table>
    `;
  }

  const riskRows = system.risks.map(r => `
    <tr>
      <td style="padding:4px 8px;border:1px solid #333;font-size:10px">${escapeHtml(r.hazard)}</td>
      <td style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:center">${r.severity}</td>
      <td style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:center">${r.likelihood}</td>
      <td style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:center;font-weight:bold;color:${r.riskLevel === "critical" ? "#ef4444" : r.riskLevel === "high" ? "#f97316" : r.riskLevel === "medium" ? "#eab308" : "#22c55e"}">${r.riskLevel.toUpperCase()}</td>
      <td style="padding:4px 8px;border:1px solid #333;font-size:10px">${escapeHtml(r.mitigation)}</td>
    </tr>
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>${escapeHtml(system.name)} — Safety Analysis Report</title>
      <style>
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        body { font-family: Arial, Helvetica, sans-serif; background: #0f0f1a; color: #e0e0e0; margin: 0; padding: 24px; }
        @page { size: A4 landscape; margin: 12mm; }
      </style>
    </head>
    <body>
      <div style="border-bottom:2px solid #f97316;padding-bottom:12px;margin-bottom:16px">
        <h1 style="color:#f97316;font-size:22px;margin:0">${escapeHtml(system.name)} (${escapeHtml(system.nameFr)})</h1>
        <p style="font-size:10px;color:#888;margin:4px 0">${escapeHtml(system.description)}</p>
        <div style="display:flex;gap:24px;margin-top:8px;font-size:11px;color:#888">
          <span>Engineer: <strong style="color:#e0e0e0">${escapeHtml(metadata.engineerName || "Not specified")}</strong></span>
          <span>Date: <strong style="color:#e0e0e0">${metadata.date}</strong></span>
          <span>Generated: <strong style="color:#e0e0e0">${new Date().toLocaleString()}</strong></span>
        </div>
      </div>

      <div style="display:flex;gap:16px;margin-bottom:16px">
        <div style="padding:8px 12px;background:#1a1a2e;border:1px solid #333;border-radius:4px">
          <span style="font-size:9px;color:#888">MAX RPN</span><br/>
          <span style="font-size:18px;font-weight:bold;color:#f97316">${sysMaxRpn}</span>
        </div>
        <div style="padding:8px 12px;background:#1a1a2e;border:1px solid #333;border-radius:4px">
          <span style="font-size:9px;color:#888">CRITICAL</span><br/>
          <span style="font-size:18px;font-weight:bold;color:#ef4444">${sysCritical}</span>
        </div>
        <div style="padding:8px 12px;background:#1a1a2e;border:1px solid #333;border-radius:4px">
          <span style="font-size:9px;color:#888">HIGH</span><br/>
          <span style="font-size:18px;font-weight:bold;color:#f97316">${sysHigh}</span>
        </div>
        <div style="padding:8px 12px;background:#1a1a2e;border:1px solid #333;border-radius:4px">
          <span style="font-size:9px;color:#888">FMEA ITEMS</span><br/>
          <span style="font-size:18px;font-weight:bold">${system.fmea.length}</span>
        </div>
        <div style="padding:8px 12px;background:#1a1a2e;border:1px solid #333;border-radius:4px">
          <span style="font-size:9px;color:#888">SAFETY FN</span><br/>
          <span style="font-size:18px;font-weight:bold">${system.safetyFunctions.length}</span>
        </div>
      </div>

      ${system.fmea.length > 0 ? `
        <h2 style="font-size:14px;color:#f97316;margin-bottom:6px">FMEA Analysis</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <thead>
            <tr style="background:#1a1a2e">
              <th style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:left">Component</th>
              <th style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:left">Failure Mode</th>
              <th style="padding:4px 8px;border:1px solid #333;font-size:10px">S</th>
              <th style="padding:4px 8px;border:1px solid #333;font-size:10px">O</th>
              <th style="padding:4px 8px;border:1px solid #333;font-size:10px">D</th>
              <th style="padding:4px 8px;border:1px solid #333;font-size:10px">RPN</th>
              <th style="padding:4px 8px;border:1px solid #333;font-size:10px">Risk</th>
              <th style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:left">Mitigation</th>
            </tr>
          </thead>
          <tbody>${fmeaRows}</tbody>
        </table>
      ` : ""}

      ${system.risks.length > 0 ? `
        <h2 style="font-size:14px;color:#f97316;margin-bottom:6px">Risk Matrix</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <thead>
            <tr style="background:#1a1a2e">
              <th style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:left">Hazard</th>
              <th style="padding:4px 8px;border:1px solid #333;font-size:10px">Severity</th>
              <th style="padding:4px 8px;border:1px solid #333;font-size:10px">Likelihood</th>
              <th style="padding:4px 8px;border:1px solid #333;font-size:10px">Risk Level</th>
              <th style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:left">Mitigation</th>
            </tr>
          </thead>
          <tbody>${riskRows}</tbody>
        </table>
      ` : ""}

      ${system.safetyFunctions.length > 0 ? `
        <h2 style="font-size:14px;color:#f97316;margin-bottom:6px">Safety Functions (ISO 13849)</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <thead>
            <tr style="background:#1a1a2e">
              <th style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:left">Function</th>
              <th style="padding:4px 8px;border:1px solid #333;font-size:10px">PLr</th>
              <th style="padding:4px 8px;border:1px solid #333;font-size:10px">Cat.</th>
              <th style="padding:4px 8px;border:1px solid #333;font-size:10px;text-align:left">Description</th>
            </tr>
          </thead>
          <tbody>${safetyRows}</tbody>
        </table>
      ` : ""}

      ${plrSection}

      ${system.safetyMeasures.length > 0 ? `
        <h2 style="font-size:14px;color:#f97316;margin-bottom:6px">Safety Measures</h2>
        <ul style="font-size:10px;margin:0 0 16px 16px;padding:0">
          ${system.safetyMeasures.map(m => `<li style="margin-bottom:2px">${escapeHtml(m)}</li>`).join("")}
        </ul>
      ` : ""}

      ${system.consequences.length > 0 ? `
        <h2 style="font-size:14px;color:#f97316;margin-bottom:6px">Consequences</h2>
        <ul style="font-size:10px;margin:0 0 16px 16px;padding:0">
          ${system.consequences.map(c => `<li style="margin-bottom:2px">${escapeHtml(c)}</li>`).join("")}
        </ul>
      ` : ""}

      <div style="margin-top:32px;padding-top:12px;border-top:1px solid #333;font-size:9px;color:#666;text-align:center">
        ${escapeHtml(system.name)} — Safety Analysis Report — ISO 12100 / ISO 13849 — Generated ${new Date().toISOString().split("T")[0]}
        ${metadata.engineerName ? ` — Prepared by ${escapeHtml(metadata.engineerName)}` : ""}
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
