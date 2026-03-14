import type { RiskEntry, RiskLevel } from "@/data/systems";
import { RiskBadge } from "./RiskBadge";

const severityLabels = ["", "Negligible", "Minor", "Moderate", "Major", "Catastrophic"];
const probabilityLabels = ["", "Improbable", "Remote", "Occasional", "Probable", "Frequent"];

function getCellLevel(s: number, p: number): RiskLevel {
  const score = s * p;
  if (score >= 16) return "critical";
  if (score >= 9) return "high";
  if (score >= 4) return "medium";
  return "low";
}

const cellColors: Record<RiskLevel, string> = {
  low: "bg-risk-low/20 border-risk-low/30",
  medium: "bg-risk-medium/20 border-risk-medium/30",
  high: "bg-risk-high/20 border-risk-high/30",
  critical: "bg-risk-critical/20 border-risk-critical/30",
};

export function RiskMatrix({ entries }: { entries: RiskEntry[] }) {
  const getEntriesAt = (s: number, p: number) =>
    entries.filter((e) => e.severity === s && e.probability === p);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-right font-mono text-muted-foreground w-24">
                Sev \ Prob
              </th>
              {[1, 2, 3, 4, 5].map((p) => (
                <th key={p} className="px-2 py-1.5 text-center font-mono w-28 text-muted-foreground">
                  <div>{p}</div>
                  <div className="text-[9px] font-normal">{probabilityLabels[p]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[5, 4, 3, 2, 1].map((s) => (
              <tr key={s}>
                <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">
                  <div>{s}</div>
                  <div className="text-[9px]">{severityLabels[s]}</div>
                </td>
                {[1, 2, 3, 4, 5].map((p) => {
                  const level = getCellLevel(s, p);
                  const cellEntries = getEntriesAt(s, p);
                  return (
                    <td
                      key={p}
                      className={`px-2 py-2 border text-center align-top min-w-[100px] ${cellColors[level]}`}
                    >
                      <div className="text-[9px] font-mono font-semibold uppercase mb-1 opacity-60">
                        {level}
                      </div>
                      {cellEntries.map((e) => (
                        <div key={e.id} className="text-[10px] leading-tight mt-1 text-foreground">
                          {e.hazard}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border rounded-sm overflow-hidden">
        <table className="w-full text-xs table-zebra">
          <thead>
            <tr className="bg-muted">
              <th className="px-3 py-2 text-left font-semibold">Hazard</th>
              <th className="px-3 py-2 text-center font-mono font-semibold">Severity</th>
              <th className="px-3 py-2 text-center font-mono font-semibold">Probability</th>
              <th className="px-3 py-2 text-center font-semibold">Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-3 py-1.5">{e.hazard}</td>
                <td className="px-3 py-1.5 text-center font-mono">{e.severity}</td>
                <td className="px-3 py-1.5 text-center font-mono">{e.probability}</td>
                <td className="px-3 py-1.5 text-center"><RiskBadge level={e.riskLevel} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
