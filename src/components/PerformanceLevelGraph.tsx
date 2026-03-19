import { useState } from "react";
import type { SystemData } from "@/data/systems";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

const PL_LEVELS = ["a", "b", "c", "d", "e"] as const;

const PL_DESCRIPTIONS: Record<string, { label: string; meaning: string; mtthf: string; color: string }> = {
  a: { label: "PLa", meaning: "Low contribution to risk reduction. Suitable where consequences are reversible injury and frequency of exposure is rare.", mtthf: "≥ 3 × 10⁵ hours", color: "bg-risk-low" },
  b: { label: "PLb", meaning: "Some contribution to risk reduction. Appropriate for reversible injuries with infrequent exposure.", mtthf: "≥ 3 × 10⁵ to 3 × 10⁶ hours", color: "bg-risk-low" },
  c: { label: "PLc", meaning: "Significant contribution to risk reduction. Required when irreversible injury is possible but exposure is infrequent.", mtthf: "≥ 3 × 10⁶ to 10⁷ hours", color: "bg-risk-medium" },
  d: { label: "PLd", meaning: "High contribution to risk reduction. Required where serious or fatal injury is possible and exposure is frequent.", mtthf: "≥ 10⁷ to 10⁸ hours", color: "bg-risk-high" },
  e: { label: "PLe", meaning: "Highest performance level. Required when death or severe irreversible injury is likely without the safety function.", mtthf: "≥ 10⁸ hours", color: "bg-risk-critical" },
};

const SOD_DESCRIPTIONS = {
  severity: [
    { value: 1, label: "No effect", desc: "No discernible effect on the system" },
    { value: 2, label: "Very minor", desc: "Very minor disruption, operator may not notice" },
    { value: 3, label: "Minor", desc: "Minor disruption, slight performance degradation" },
    { value: 4, label: "Very low", desc: "Minor impact on system, no safety concern" },
    { value: 5, label: "Low", desc: "Moderate impact on performance, no injury risk" },
    { value: 6, label: "Moderate", desc: "Degraded performance, potential minor injury" },
    { value: 7, label: "High", desc: "Severe performance loss, possible serious injury" },
    { value: 8, label: "Very high", desc: "System inoperable, likely serious injury" },
    { value: 9, label: "Hazardous with warning", desc: "Potential fatality with warning signs present" },
    { value: 10, label: "Hazardous without warning", desc: "Sudden catastrophic failure risking fatality" },
  ],
  occurrence: [
    { value: 1, label: "Almost impossible", desc: "< 1 in 1,000,000 operations" },
    { value: 2, label: "Remote", desc: "1 in 1,000,000 operations" },
    { value: 3, label: "Very low", desc: "1 in 100,000 operations" },
    { value: 4, label: "Low", desc: "1 in 10,000 operations" },
    { value: 5, label: "Moderate low", desc: "1 in 2,000 operations" },
    { value: 6, label: "Moderate", desc: "1 in 500 operations" },
    { value: 7, label: "Moderate high", desc: "1 in 100 operations" },
    { value: 8, label: "High", desc: "1 in 20 operations" },
    { value: 9, label: "Very high", desc: "1 in 10 operations" },
    { value: 10, label: "Almost certain", desc: "≥ 1 in 2 operations" },
  ],
  detection: [
    { value: 1, label: "Almost certain", desc: "Failure will certainly be detected before effect" },
    { value: 2, label: "Very high", desc: "Very high chance of detection through multiple methods" },
    { value: 3, label: "High", desc: "High detection probability via automated monitoring" },
    { value: 4, label: "Moderate high", desc: "Good chance of detection via routine inspection" },
    { value: 5, label: "Moderate", desc: "Moderate detection through periodic testing" },
    { value: 6, label: "Low", desc: "Low detection, may only be found during scheduled maintenance" },
    { value: 7, label: "Very low", desc: "Very low detection, requires specific inspection" },
    { value: 8, label: "Remote", desc: "Remote chance of detection, failure is hidden" },
    { value: 9, label: "Very remote", desc: "Almost no mechanism exists to detect this failure" },
    { value: 10, label: "Absolute uncertainty", desc: "No known detection method exists" },
  ],
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  B: "Basic safety principles applied. No special safety measures.",
  "1": "Use of well-tried components. Single channel architecture.",
  "2": "Self-monitoring with periodic testing. Safety function checked at intervals.",
  "3": "Single fault tolerance. Safety function continues even if one fault occurs.",
  "4": "Maximum fault tolerance. Faults detected at or before the next demand.",
};

interface Props {
  systems: SystemData[];
}

export function PerformanceLevelGraph({ systems }: Props) {
  const [expandedPL, setExpandedPL] = useState<string | null>(null);
  const [expandedSOD, setExpandedSOD] = useState<"severity" | "occurrence" | "detection" | null>(null);

  const allSafetyFunctions = systems.flatMap(s =>
    s.safetyFunctions.map(sf => ({ ...sf, systemName: s.name }))
  );

  const plCounts = PL_LEVELS.map(pl => ({
    level: pl,
    count: allSafetyFunctions.filter(sf => sf.plr === pl).length,
    functions: allSafetyFunctions.filter(sf => sf.plr === pl),
  }));

  const maxCount = Math.max(...plCounts.map(p => p.count), 1);

  return (
    <div className="space-y-4">
      {/* PL Graph */}
      <div className="border border-border/50 rounded bg-card/60 backdrop-blur-sm p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
          <Info className="h-3.5 w-3.5" />
          Performance Level Distribution (ISO 13849)
        </h3>
        <div className="space-y-2">
          {plCounts.map(({ level, count, functions: fns }) => {
            const info = PL_DESCRIPTIONS[level];
            const isExpanded = expandedPL === level;
            const barWidth = count > 0 ? Math.max((count / maxCount) * 100, 8) : 0;

            return (
              <div key={level}>
                <button
                  type="button"
                  onClick={() => setExpandedPL(isExpanded ? null : level)}
                  className="w-full flex items-center gap-3 text-xs group hover:bg-muted/30 rounded px-1 py-1 transition-colors"
                >
                  <span className={`w-8 h-8 rounded flex items-center justify-center font-mono font-bold text-sm ${info.color}/20 border border-current`}>
                    {level.toUpperCase()}
                  </span>
                  <div className="flex-1 h-5 bg-muted/30 rounded overflow-hidden">
                    <div
                      className={`h-full ${info.color} rounded transition-all duration-500`}
                      style={{ width: `${barWidth}%`, opacity: 0.7 }}
                    />
                  </div>
                  <span className="font-mono w-6 text-right">{count}</span>
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {isExpanded && (
                  <div className="ml-11 mt-1 mb-2 p-3 bg-muted/20 border border-border/30 rounded text-xs space-y-2">
                    <p className="text-foreground">{info.meaning}</p>
                    <p className="text-muted-foreground font-mono">MTTFd: {info.mtthf}</p>
                    {fns.length > 0 && (
                      <div className="mt-2">
                        <p className="text-muted-foreground font-semibold mb-1">Functions at this level:</p>
                        {fns.map(fn => (
                          <div key={fn.id} className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-primary">›</span>
                            <span className="font-mono text-[10px] text-primary/60">[{fn.systemName}]</span>
                            {fn.function}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Descriptions */}
      <div className="border border-border/50 rounded bg-card/60 backdrop-blur-sm p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
          Safety Categories (ISO 13849-1)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
          {Object.entries(CATEGORY_DESCRIPTIONS).map(([cat, desc]) => (
            <div key={cat} className="p-2 bg-muted/20 border border-border/30 rounded">
              <span className="font-mono font-bold text-primary">Cat. {cat}</span>
              <p className="text-muted-foreground mt-1 text-[10px]">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SOD Dropdowns */}
      <div className="border border-border/50 rounded bg-card/60 backdrop-blur-sm p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
          RPN Scale Reference (S × O × D)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(["severity", "occurrence", "detection"] as const).map(type => {
            const isOpen = expandedSOD === type;
            const items = SOD_DESCRIPTIONS[type];
            const label = type === "severity" ? "Severity (S)" : type === "occurrence" ? "Occurrence (O)" : "Detection (D)";

            return (
              <div key={type} className="border border-border/30 rounded">
                <button
                  type="button"
                  onClick={() => setExpandedSOD(isOpen ? null : type)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold hover:bg-muted/30 transition-colors"
                >
                  <span className="font-mono text-primary">{label}</span>
                  {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {isOpen && (
                  <div className="border-t border-border/30 max-h-64 overflow-y-auto">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="bg-muted/30">
                          <th className="px-2 py-1 text-left font-mono w-8">#</th>
                          <th className="px-2 py-1 text-left">Level</th>
                          <th className="px-2 py-1 text-left">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => (
                          <tr key={item.value} className="border-t border-border/20">
                            <td className="px-2 py-1 font-mono font-bold text-primary">{item.value}</td>
                            <td className="px-2 py-1 font-medium">{item.label}</td>
                            <td className="px-2 py-1 text-muted-foreground">{item.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
