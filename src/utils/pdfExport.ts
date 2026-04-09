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

function rpnColor(rpn: number): string {
  if (rpn >= 200) return "#dc2626";
  if (rpn >= 120) return "#ea580c";
  if (rpn >= 80) return "#ca8a04";
  return "#16a34a";
}

function riskColor(level: string): string {
  if (level === "critical") return "#dc2626";
  if (level === "high") return "#ea580c";
  if (level === "medium") return "#ca8a04";
  return "#16a34a";
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const PRINT_STYLES = `
  @media print { 
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  @page { size: A4 landscape; margin: 12mm; }
  body {
    font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
    background: #ffffff;
    color: #1a1a1a;
    margin: 0;
    padding: 24px;
    font-size: 11px;
    line-height: 1.4;
  }
  h1 { color: #c2410c; font-size: 20px; margin: 0 0 4px 0; }
  h2 { color: #c2410c; font-size: 14px; margin: 16px 0 6px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  h3 { color: #c2410c; font-size: 12px; margin: 12px 0 6px 0; }
  .header { border-bottom: 3px solid #c2410c; padding-bottom: 12px; margin-bottom: 16px; }
  .meta { display: flex; gap: 24px; margin-top: 8px; font-size: 10px; color: #6b7280; }
  .meta strong { color: #1a1a1a; }
  .kpi-row { display: flex; gap: 12px; margin-bottom: 16px; }
  .kpi { padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; text-align: center; min-width: 80px; }
  .kpi-label { font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
  .kpi-value { font-size: 22px; font-weight: 700; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  th { background: #1e293b; color: #ffffff; padding: 6px 8px; border: 1px solid #334155; font-size: 9px; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 600; }
  td { padding: 5px 8px; border: 1px solid #d1d5db; font-size: 10px; }
  tr:nth-child(even) td { background: #f9fafb; }
  .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #d1d5db; font-size: 8px; color: #9ca3af; text-align: center; }
  .page-break { page-break-before: always; margin-top: 20px; }
`;

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
      .map(row => {
        const resRpn = row.residualRpn ?? row.rpn;
        const reduction = row.rpn > 0 ? Math.round(((row.rpn - resRpn) / row.rpn) * 100) : 0;
        return `
        <tr>
          <td>${escapeHtml(row.component)}</td>
          <td>${escapeHtml(row.failureMode)}</td>
          <td style="text-align:center">${row.severity}</td>
          <td style="text-align:center">${row.occurrence}</td>
          <td style="text-align:center">${row.detection}</td>
          <td style="text-align:center;font-weight:bold;color:${rpnColor(row.rpn)}">${row.rpn}</td>
          <td>${escapeHtml(row.mitigation)}</td>
          <td style="text-align:center;background:#f0fdf4">${row.residualSeverity ?? row.severity}</td>
          <td style="text-align:center;background:#f0fdf4">${row.residualOccurrence ?? row.occurrence}</td>
          <td style="text-align:center;background:#f0fdf4">${row.residualDetection ?? row.detection}</td>
          <td style="text-align:center;font-weight:bold;background:#f0fdf4;color:${rpnColor(resRpn)}">${resRpn}</td>
          <td style="text-align:center;font-weight:600;color:${reduction >= 50 ? '#16a34a' : reduction >= 25 ? '#ca8a04' : '#ea580c'}">${reduction > 0 ? `↓${reduction}%` : '—'}</td>
          <td style="text-align:center">${row.riskAccepted ? '✓' : '—'}</td>
        </tr>`;
      }).join("");

    const safetyRows = system.safetyFunctions.map(sf => `
      <tr>
        <td>${escapeHtml(sf.function)}</td>
        <td style="text-align:center;font-weight:bold">${sf.plr.toUpperCase()}</td>
        <td style="text-align:center">${sf.category}</td>
        <td>${escapeHtml(sf.description)}</td>
      </tr>
    `).join("");

    return `
      <div class="page-break">
        <h2>${escapeHtml(system.name)} (${escapeHtml(system.nameFr)})</h2>
        <p style="font-size:10px;color:#6b7280;margin-bottom:8px">${escapeHtml(system.description)}</p>
        <div class="kpi-row">
          <div class="kpi">
            <div class="kpi-label">Max RPN</div>
            <div class="kpi-value" style="color:#c2410c">${sysMaxRpn}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Critical</div>
            <div class="kpi-value" style="color:#dc2626">${sysCritical}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">FMEA Items</div>
            <div class="kpi-value">${system.fmea.length}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Safety Fn</div>
            <div class="kpi-value">${system.safetyFunctions.length}</div>
          </div>
        </div>
        ${system.fmea.length > 0 ? `
          <h3>FMEA Analysis (Top ${Math.min(10, system.fmea.length)})</h3>
          <table>
            <thead>
              <tr>
                <th style="text-align:left">Component</th>
                <th style="text-align:left">Failure Mode</th>
                <th>S</th><th>O</th><th>D</th><th>RPN</th>
                <th style="text-align:left">Mitigation</th>
                <th style="background:#16a34a;color:#fff">S'</th>
                <th style="background:#16a34a;color:#fff">O'</th>
                <th style="background:#16a34a;color:#fff">D'</th>
                <th style="background:#16a34a;color:#fff">RPN'</th>
                <th>↓%</th>
                <th>OK</th>
              </tr>
            </thead>
            <tbody>${fmeaRows}</tbody>
          </table>
        ` : ""}
        ${system.safetyFunctions.length > 0 ? `
          <h3>Safety Functions (ISO 13849)</h3>
          <table>
            <thead>
              <tr>
                <th style="text-align:left">Function</th>
                <th>PLr</th><th>Cat.</th>
                <th style="text-align:left">Description</th>
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
      <title>Tunnel Vehicle System — Safety Analysis Report</title>
      <style>${PRINT_STYLES}</style>
    </head>
    <body>
      <div class="header">
        <h1>Tunnel Vehicle System — Safety Analysis Report</h1>
        <div class="meta">
          <span>Engineer: <strong>${escapeHtml(metadata.engineerName || "Not specified")}</strong></span>
          <span>Date: <strong>${metadata.date}</strong></span>
          <span>Generated: <strong>${new Date().toLocaleString()}</strong></span>
        </div>
        ${metadata.notes ? `<p style="font-size:10px;color:#6b7280;margin-top:4px">Notes: ${escapeHtml(metadata.notes)}</p>` : ""}
      </div>

      <h2>Executive Summary</h2>
      <div class="kpi-row">
        <div class="kpi">
          <div class="kpi-label">Total Failure Modes</div>
          <div class="kpi-value">${totalFMEA}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Critical Risks</div>
          <div class="kpi-value" style="color:#dc2626">${criticalRisks}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">High Risks</div>
          <div class="kpi-value" style="color:#ea580c">${highRisks}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Max RPN</div>
          <div class="kpi-value" style="color:#c2410c">${maxRpn}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Avg RPN</div>
          <div class="kpi-value">${avgRpn}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Subsystems</div>
          <div class="kpi-value">${systems.length}</div>
        </div>
      </div>

      ${systemSections}

      <div class="footer">
        Tunnel Vehicle System — Safety Analysis Report — ISO 12100 / ISO 13849 — Generated ${new Date().toISOString().split("T")[0]}
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
    .map(row => {
      const resRpn = row.residualRpn ?? row.rpn;
      const reduction = row.rpn > 0 ? Math.round(((row.rpn - resRpn) / row.rpn) * 100) : 0;
      return `
      <tr>
        <td>${escapeHtml(row.component)}</td>
        <td>${escapeHtml(row.failureMode)}</td>
        <td style="text-align:center">${row.severity}</td>
        <td style="text-align:center">${row.occurrence}</td>
        <td style="text-align:center">${row.detection}</td>
        <td style="text-align:center;font-weight:bold;color:${rpnColor(row.rpn)}">${row.rpn}</td>
        <td>${escapeHtml(row.mitigation)}</td>
        <td style="text-align:center;background:#f0fdf4">${row.residualSeverity ?? row.severity}</td>
        <td style="text-align:center;background:#f0fdf4">${row.residualOccurrence ?? row.occurrence}</td>
        <td style="text-align:center;background:#f0fdf4">${row.residualDetection ?? row.detection}</td>
        <td style="text-align:center;font-weight:bold;background:#f0fdf4;color:${rpnColor(resRpn)}">${resRpn}</td>
        <td style="text-align:center;font-weight:600;color:${reduction >= 50 ? '#16a34a' : reduction >= 25 ? '#ca8a04' : '#ea580c'}">${reduction > 0 ? `↓${reduction}%` : '—'}</td>
        <td style="text-align:center">${row.riskAccepted ? '✓' : '—'}</td>
      </tr>`;
    }).join("");

  const safetyRows = system.safetyFunctions.map(sf => `
    <tr>
      <td>${escapeHtml(sf.function)}</td>
      <td style="text-align:center;font-weight:bold">${sf.plr.toUpperCase()}</td>
      <td style="text-align:center">${sf.category}</td>
      <td>${escapeHtml(sf.description)}</td>
    </tr>
  `).join("");

  let plrSection = "";
  if (hazardContext) {
    const plr = determinePLr(hazardContext.severity, hazardContext.frequency, hazardContext.avoidance);
    const cat = plrToCategory(plr);
    plrSection = `
      <h3>PLr Determination (ISO 13849-1 Clause 4.3)</h3>
      <table>
        <tr>
          <td style="background:#f1f5f9;width:25%;font-weight:600">Safety Function</td>
          <td colspan="3">${escapeHtml(hazardContext.safetyFunction)}</td>
        </tr>
        <tr>
          <td style="background:#f1f5f9;font-weight:600">Hazard</td>
          <td colspan="3">${escapeHtml(hazardContext.hazard)}</td>
        </tr>
        <tr>
          <td style="background:#f1f5f9;font-weight:600">Severity</td>
          <td>${hazardContext.severity}</td>
          <td style="background:#f1f5f9;font-weight:600">Justification</td>
          <td>${escapeHtml(hazardContext.severityJustification)}</td>
        </tr>
        <tr>
          <td style="background:#f1f5f9;font-weight:600">Frequency</td>
          <td>${hazardContext.frequency}</td>
          <td style="background:#f1f5f9;font-weight:600">Justification</td>
          <td>${escapeHtml(hazardContext.frequencyJustification)}</td>
        </tr>
        <tr>
          <td style="background:#f1f5f9;font-weight:600">Avoidance</td>
          <td>${hazardContext.avoidance}</td>
          <td style="background:#f1f5f9;font-weight:600">Justification</td>
          <td>${escapeHtml(hazardContext.avoidanceJustification)}</td>
        </tr>
        <tr style="background:#f0fdf4">
          <td colspan="2" style="font-size:12px;font-weight:700;color:#16a34a;padding:8px 10px">Result: PLr = ${plr.toUpperCase()}</td>
          <td colspan="2" style="font-size:12px;font-weight:700;color:#16a34a;padding:8px 10px">Minimum Category: ${cat}</td>
        </tr>
      </table>
    `;
  }

  const riskRows = system.risks.map(r => `
    <tr>
      <td>${escapeHtml(r.hazard)}</td>
      <td style="text-align:center">${r.severity}</td>
      <td style="text-align:center">${r.probability}</td>
      <td style="text-align:center;font-weight:bold;color:${riskColor(r.riskLevel)}">${r.riskLevel.toUpperCase()}</td>
    </tr>
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>${escapeHtml(system.name)} — Safety Analysis Report</title>
      <style>${PRINT_STYLES}</style>
    </head>
    <body>
      <div class="header">
        <h1>${escapeHtml(system.name)} (${escapeHtml(system.nameFr)})</h1>
        <p style="font-size:10px;color:#6b7280;margin:4px 0">${escapeHtml(system.description)}</p>
        <div class="meta">
          <span>Engineer: <strong>${escapeHtml(metadata.engineerName || "Not specified")}</strong></span>
          <span>Date: <strong>${metadata.date}</strong></span>
          <span>Generated: <strong>${new Date().toLocaleString()}</strong></span>
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi">
          <div class="kpi-label">Max RPN</div>
          <div class="kpi-value" style="color:#c2410c">${sysMaxRpn}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Critical</div>
          <div class="kpi-value" style="color:#dc2626">${sysCritical}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">High</div>
          <div class="kpi-value" style="color:#ea580c">${sysHigh}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">FMEA Items</div>
          <div class="kpi-value">${system.fmea.length}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Safety Fn</div>
          <div class="kpi-value">${system.safetyFunctions.length}</div>
        </div>
      </div>

      ${system.fmea.length > 0 ? `
        <h2>FMEA Analysis — Risk Reduction Verification (ISO 12100)</h2>
        <table>
          <thead>
            <tr>
              <th style="text-align:left">Component</th>
              <th style="text-align:left">Failure Mode</th>
              <th>S</th><th>O</th><th>D</th><th>RPN</th>
              <th style="text-align:left">Mitigation</th>
              <th style="background:#16a34a;color:#fff">S'</th>
              <th style="background:#16a34a;color:#fff">O'</th>
              <th style="background:#16a34a;color:#fff">D'</th>
              <th style="background:#16a34a;color:#fff">RPN'</th>
              <th>↓%</th>
              <th>OK</th>
            </tr>
          </thead>
          <tbody>${fmeaRows}</tbody>
        </table>
      ` : ""}

      ${system.risks.length > 0 ? `
        <h2>Risk Matrix</h2>
        <table>
          <thead>
            <tr>
              <th style="text-align:left">Hazard</th>
              <th>Severity</th><th>Probability</th><th>Risk Level</th>
            </tr>
          </thead>
          <tbody>${riskRows}</tbody>
        </table>
      ` : ""}

      ${system.safetyFunctions.length > 0 ? `
        <h2>Safety Functions (ISO 13849)</h2>
        <table>
          <thead>
            <tr>
              <th style="text-align:left">Function</th>
              <th>PLr</th><th>Cat.</th>
              <th style="text-align:left">Description</th>
            </tr>
          </thead>
          <tbody>${safetyRows}</tbody>
        </table>
      ` : ""}

      ${plrSection}

      ${system.safetyMeasures.length > 0 ? `
        <h2>Safety Measures</h2>
        <ul style="font-size:10px;margin:0 0 14px 18px;padding:0">
          ${system.safetyMeasures.map(m => `<li style="margin-bottom:3px">${escapeHtml(m)}</li>`).join("")}
        </ul>
      ` : ""}

      ${system.consequences.length > 0 ? `
        <h2>Consequences</h2>
        <ul style="font-size:10px;margin:0 0 14px 18px;padding:0">
          ${system.consequences.map(c => `<li style="margin-bottom:3px">${escapeHtml(c)}</li>`).join("")}
        </ul>
      ` : ""}

      <div class="footer">
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
