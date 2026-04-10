import { useState } from "react";
import { Cpu, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Info } from "lucide-react";
import type { SafetyFunction } from "@/data/systems";

interface HardwareMetricsProps {
  sf: SafetyFunction;
  onUpdate?: (updates: Partial<SafetyFunction>) => void;
}

// ISO 13849-1 Table 5 — PL achievability matrix
const PL_MATRIX: Record<string, Record<string, Record<string, string>>> = {
  // category -> dcLevel -> mttfdLevel -> achievable PL
  "B": { "none": { "low": "a", "medium": "a", "high": "a" }},
  "1": { "none": { "low": "-", "medium": "a", "high": "b" }},
  "2": {
    "low": { "low": "a", "medium": "b", "high": "c" },
    "medium": { "low": "b", "medium": "c", "high": "d" },
  },
  "3": {
    "low": { "low": "a", "medium": "b", "high": "c" },
    "medium": { "low": "b", "medium": "c", "high": "d" },
    "high": { "low": "c", "medium": "d", "high": "d" },
  },
  "4": {
    "high": { "low": "c", "medium": "d", "high": "e" },
  },
};

function getMTTFdLevel(years?: number): "low" | "medium" | "high" | undefined {
  if (!years) return undefined;
  if (years < 10) return "low";
  if (years < 30) return "medium";
  return "high";
}

function getDCLevel(dc?: number): "none" | "low" | "medium" | "high" | undefined {
  if (dc === undefined || dc === null) return undefined;
  if (dc < 60) return "none";
  if (dc < 90) return "low";
  if (dc < 99) return "medium";
  return "high";
}

function getAchievedPL(category: string, dcLevel?: string, mttfdLevel?: string): string | null {
  if (!dcLevel || !mttfdLevel) return null;
  return PL_MATRIX[category]?.[dcLevel]?.[mttfdLevel] ?? null;
}

const plOrder = ["a", "b", "c", "d", "e"];

export function HardwareMetrics({ sf, onUpdate }: HardwareMetricsProps) {
  const [expanded, setExpanded] = useState(false);

  const mttfdLevel = getMTTFdLevel(sf.mttfd) ?? sf.mttfdLevel;
  const dcLevel = getDCLevel(sf.dcavg) ?? sf.dcLevel;
  const achievedPL = getAchievedPL(sf.category, dcLevel, mttfdLevel);
  const requiredPL = sf.plr;
  const plMet = achievedPL && plOrder.indexOf(achievedPL) >= plOrder.indexOf(requiredPL);

  return (
    <div className="border border-border/50 rounded-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="w-full bg-muted px-4 py-2 flex items-center justify-between hover:bg-muted/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Hardware Metrics — ISO 13849-1 Clause 4.5 (MTTFd, DCavg)
          </span>
        </div>
        <div className="flex items-center gap-3">
          {achievedPL && (
            <span className={`text-xs font-mono font-bold ${plMet ? "text-risk-low" : "text-risk-critical"}`}>
              Achieved PL: {achievedPL.toUpperCase()} vs Required PLr: {requiredPL.toUpperCase()} {plMet ? "✓" : "✗"}
            </span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          <p className="text-[10px] text-muted-foreground">
            Per ISO 13849-1 Clause 4.5.2 & 4.5.3: Enter MTTFd and DC values for each channel. 
            The achieved PL is determined from Category + MTTFd level + DCavg level (Table 5).
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* MTTFd */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                MTTFd — Mean Time to Dangerous Failure
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={150}
                  value={sf.mttfd ?? ""}
                  placeholder="Years"
                  onChange={e => {
                    const val = e.target.value ? Number(e.target.value) : undefined;
                    const level = getMTTFdLevel(val);
                    onUpdate?.({ mttfd: val, mttfdLevel: level });
                  }}
                  className="w-24 px-2 py-1.5 text-xs font-mono border border-border rounded-sm bg-card text-foreground"
                />
                <span className="text-xs text-muted-foreground">years</span>
                {mttfdLevel && (
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-sm ${
                    mttfdLevel === "high" ? "bg-risk-low/20 text-risk-low" :
                    mttfdLevel === "medium" ? "bg-risk-medium/20 text-risk-medium" :
                    "bg-risk-high/20 text-risk-high"
                  }`}>
                    {mttfdLevel.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground space-y-0.5">
                <div>Low: 3–10 years | Medium: 10–30 years | High: 30–100 years</div>
                <div className="italic">Cap at 100 years per component per ISO 13849-1 Clause 4.5.2</div>
              </div>
            </div>

            {/* DCavg */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                DCavg — Average Diagnostic Coverage
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={sf.dcavg ?? ""}
                  placeholder="%"
                  onChange={e => {
                    const val = e.target.value ? Number(e.target.value) : undefined;
                    const level = getDCLevel(val);
                    onUpdate?.({ dcavg: val, dcLevel: level });
                  }}
                  className="w-24 px-2 py-1.5 text-xs font-mono border border-border rounded-sm bg-card text-foreground"
                />
                <span className="text-xs text-muted-foreground">%</span>
                {dcLevel && (
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-sm ${
                    dcLevel === "high" ? "bg-risk-low/20 text-risk-low" :
                    dcLevel === "medium" ? "bg-risk-medium/20 text-risk-medium" :
                    dcLevel === "low" ? "bg-risk-high/20 text-risk-high" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {dcLevel.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground space-y-0.5">
                <div>None: &lt;60% | Low: 60–90% | Medium: 90–99% | High: ≥99%</div>
                <div className="italic">Per ISO 13849-1 Table 7</div>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className={`flex items-start gap-3 p-3 rounded-sm border ${
            plMet ? "bg-risk-low/5 border-risk-low/30" : achievedPL ? "bg-risk-critical/5 border-risk-critical/30" : "bg-muted/30 border-border"
          }`}>
            {plMet ? (
              <CheckCircle className="h-4 w-4 text-risk-low shrink-0 mt-0.5" />
            ) : achievedPL ? (
              <AlertCircle className="h-4 w-4 text-risk-critical shrink-0 mt-0.5" />
            ) : (
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              {achievedPL ? (
                <>
                  <p className="font-semibold">
                    Category {sf.category} + MTTFd {mttfdLevel?.toUpperCase()} + DCavg {dcLevel?.toUpperCase()} → 
                    Achieved PL = <strong>{achievedPL.toUpperCase()}</strong>
                  </p>
                  <p className={`mt-1 ${plMet ? "text-risk-low" : "text-risk-critical"}`}>
                    {plMet 
                      ? `✓ Achieved PL ${achievedPL.toUpperCase()} meets or exceeds required PLr ${requiredPL.toUpperCase()}`
                      : `✗ Achieved PL ${achievedPL.toUpperCase()} does NOT meet required PLr ${requiredPL.toUpperCase()} — redesign required`
                    }
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">Enter MTTFd and DCavg values to determine the achieved Performance Level per ISO 13849-1 Table 5.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
