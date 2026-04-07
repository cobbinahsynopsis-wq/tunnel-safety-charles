import type { SafetyFunction, FMEARow, FaultTreeNode } from "@/data/systems";
import { EditableCell } from "./EditableCell";
import { Plus, Trash2, Info, AlertTriangle, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";
import {
  calculatePLr,
  validateWithFMEA,
  determinePLr,
  plrToCategory,
  type HazardContext,
  type SeverityClass,
  type FrequencyClass,
  type AvoidanceClass,
  type PLrLevel,
} from "@/utils/plrCalculation";
import { useState } from "react";

const plrColors: Record<string, string> = {
  a: "bg-risk-low/20 text-risk-low",
  b: "bg-risk-low/20 text-risk-low",
  c: "bg-risk-medium/20 text-risk-medium",
  d: "bg-risk-high/20 text-risk-high",
  e: "bg-risk-critical/20 text-risk-critical",
};

const plrDescriptions: Record<string, string> = {
  a: "PLr a — Lowest required performance level. Suitable when hazard severity is slight and exposure is infrequent.",
  b: "PLr b — Low performance level. Required for slight injury with frequent exposure, or serious injury with infrequent exposure and good avoidance.",
  c: "PLr c — Medium performance level. Required when serious injury possible with infrequent exposure but limited avoidance.",
  d: "PLr d — High performance level. Required for serious/irreversible injury with frequent exposure but some avoidance.",
  e: "PLr e — Highest required performance level. Mandatory for serious/irreversible injury or death with frequent exposure and scarcely possible avoidance.",
};

const severityOptions: Array<{ value: SeverityClass; label: string; description: string }> = [
  { value: "S1", label: "S1 — Slight injury", description: "Reversible injury (bruise, minor cut). Person recovers fully." },
  { value: "S2", label: "S2 — Serious injury or death", description: "Irreversible injury (amputation, crush, fatality). Any uncontrolled movement of heavy machinery → S2." },
];

const frequencyOptions: Array<{ value: FrequencyClass; label: string; description: string }> = [
  { value: "F1", label: "F1 — Rare/low exposure", description: "Personnel seldom exposed. Isolated operation, limited access zone." },
  { value: "F2", label: "F2 — Frequent/continuous exposure", description: "Personnel frequently or continuously exposed. Shared workspace, maintenance access." },
];

const avoidanceOptions: Array<{ value: AvoidanceClass; label: string; description: string }> = [
  { value: "P1", label: "P1 — Avoidance possible", description: "Hazard can be avoided under specific conditions (e.g., slow speed, warning systems, escape routes)." },
  { value: "P2", label: "P2 — Avoidance scarcely possible", description: "Hazard cannot be reliably avoided (e.g., sudden failure, confined space, no reaction time)." },
];

interface SafetyFunctionsTableProps {
  functions: SafetyFunction[];
  hazardContext: HazardContext;
  fmeaRows?: ReadonlyArray<FMEARow>;
  faultTree?: FaultTreeNode;
  onUpdate?: (sfId: string, updates: Partial<SafetyFunction>) => void;
  onAdd?: (sf: SafetyFunction) => void;
  onDelete?: (sfId: string) => void;
  onUpdateContext?: (updates: Partial<HazardContext>) => void;
}

function ParameterSelector<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string; description: string }>;
  onChange?: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="space-y-1">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange?.(opt.value)}
            className={`w-full text-left px-3 py-2 rounded-sm border text-xs transition-colors ${
              value === opt.value
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/50"
            }`}
          >
            <span className="font-semibold font-mono">{opt.label}</span>
            <p className="text-[10px] mt-0.5 opacity-80">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SafetyFunctionsTable({
  functions,
  hazardContext,
  fmeaRows,
  faultTree,
  onUpdate,
  onAdd,
  onDelete,
  onUpdateContext,
}: SafetyFunctionsTableProps) {
  const [showJustification, setShowJustification] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showParameters, setShowParameters] = useState(false);

  const plrResult = calculatePLr(hazardContext);
  const fmeaValidation = fmeaRows
    ? validateWithFMEA(plrResult.plr, fmeaRows, faultTree)
    : null;

  const handleAdd = () => {
    if (!onAdd) return;
    onAdd({
      id: `sf-${Date.now()}`,
      function: "New safety function",
      plr: plrResult.plr,
      category: plrResult.category,
      description: "Description",
    });
  };

  return (
    <div className="space-y-3">
      {/* STEP 1: Hazard Context & PLr Determination */}
      <div className="border rounded-sm overflow-hidden">
        <div className="bg-muted px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Step 1 — PLr Determination (ISO 13849-1 Clause 4.3, Fig. 3)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowParameters(prev => !prev)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Info className="h-3.5 w-3.5" />
              {showParameters ? "Hide" : "Edit"} parameters
            </button>
            <button
              type="button"
              onClick={() => setShowJustification(prev => !prev)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              {showJustification ? "Hide" : "Show"} justification
            </button>
          </div>
        </div>

        <div className="px-4 py-3">
          {/* Hazard context summary */}
          <div className="mb-3 space-y-1">
            <div className="flex items-start gap-2 text-xs">
              <span className="font-mono font-semibold text-muted-foreground w-24 shrink-0">Safety Fn:</span>
              <EditableCell
                value={hazardContext.safetyFunction}
                onSave={v => onUpdateContext?.({ safetyFunction: v })}
              />
            </div>
            <div className="flex items-start gap-2 text-xs">
              <span className="font-mono font-semibold text-muted-foreground w-24 shrink-0">Hazard:</span>
              <EditableCell
                value={hazardContext.hazard}
                onSave={v => onUpdateContext?.({ hazard: v })}
              />
            </div>
          </div>

          {/* PLr Result display */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center justify-center w-12 h-12 rounded-sm font-mono font-bold text-xl ${plrColors[plrResult.plr] ?? ""}`}>
                {plrResult.plr.toUpperCase()}
              </span>
              <div>
                <p className="text-xs font-semibold">Required Performance Level</p>
                <p className="text-[10px] text-muted-foreground max-w-xs">
                  {plrDescriptions[plrResult.plr] ?? ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 ml-auto">
              <div className="text-center">
                <span className="block text-[10px] font-mono text-muted-foreground">Severity</span>
                <span className={`font-mono font-bold text-sm ${hazardContext.severity === "S2" ? "text-risk-critical" : "text-risk-low"}`}>
                  {hazardContext.severity}
                </span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] font-mono text-muted-foreground">Frequency</span>
                <span className={`font-mono font-bold text-sm ${hazardContext.frequency === "F2" ? "text-risk-high" : "text-risk-low"}`}>
                  {hazardContext.frequency}
                </span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] font-mono text-muted-foreground">Avoidance</span>
                <span className={`font-mono font-bold text-sm ${hazardContext.avoidance === "P2" ? "text-risk-high" : "text-risk-low"}`}>
                  {hazardContext.avoidance}
                </span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] font-mono text-muted-foreground">Min Cat.</span>
                <span className="font-mono font-bold text-sm text-primary">
                  {plrResult.category}
                </span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] font-mono text-muted-foreground">Confidence</span>
                <span className={`font-mono font-bold text-xs ${
                  plrResult.confidence === "High" ? "text-risk-low" :
                  plrResult.confidence === "Medium" ? "text-risk-medium" : "text-risk-high"
                }`}>
                  {plrResult.confidence}
                </span>
              </div>
            </div>
          </div>

          {/* Editable S/F/P Parameters */}
          {showParameters && (
            <div className="mt-3 bg-muted/30 rounded-sm p-3 grid grid-cols-3 gap-4">
              <ParameterSelector
                label="Severity (S)"
                value={hazardContext.severity}
                options={severityOptions}
                onChange={v => onUpdateContext?.({ severity: v })}
              />
              <ParameterSelector
                label="Frequency (F)"
                value={hazardContext.frequency}
                options={frequencyOptions}
                onChange={v => onUpdateContext?.({ frequency: v })}
              />
              <ParameterSelector
                label="Avoidance (P)"
                value={hazardContext.avoidance}
                options={avoidanceOptions}
                onChange={v => onUpdateContext?.({ avoidance: v })}
              />
              <div className="col-span-3 space-y-2">
                <div className="text-xs">
                  <span className="font-mono font-semibold text-muted-foreground">S Justification:</span>
                  <div className="mt-0.5">
                    <EditableCell value={hazardContext.severityJustification} onSave={v => onUpdateContext?.({ severityJustification: v })} />
                  </div>
                </div>
                <div className="text-xs">
                  <span className="font-mono font-semibold text-muted-foreground">F Justification:</span>
                  <div className="mt-0.5">
                    <EditableCell value={hazardContext.frequencyJustification} onSave={v => onUpdateContext?.({ frequencyJustification: v })} />
                  </div>
                </div>
                <div className="text-xs">
                  <span className="font-mono font-semibold text-muted-foreground">P Justification:</span>
                  <div className="mt-0.5">
                    <EditableCell value={hazardContext.avoidanceJustification} onSave={v => onUpdateContext?.({ avoidanceJustification: v })} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Justification */}
          {showJustification && (
            <div className="mt-3 bg-muted/50 rounded-sm p-3 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {plrResult.justification}
                </p>
              </div>
              {plrResult.assumptions.length > 0 && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-risk-medium shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold">Assumptions:</span>
                    <ul className="list-disc list-inside mt-0.5">
                      {plrResult.assumptions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <p className="text-[10px] font-mono text-muted-foreground/70 italic">
                Ref: {plrResult.isoReference}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* STEP 2: FMEA Validation (§4.6) */}
      {fmeaValidation && (
        <div className="border rounded-sm overflow-hidden">
          <div className="bg-muted px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Step 2 — FMEA Validation (ISO 13849-1 §4.6 / IEC 62061 §6.7)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowValidation(prev => !prev)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Info className="h-3.5 w-3.5" />
              {showValidation ? "Hide" : "Show"} details
            </button>
          </div>

          <div className="px-4 py-3">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 text-xs font-semibold ${fmeaValidation.isConsistent ? "text-risk-low" : "text-risk-high"}`}>
                {fmeaValidation.isConsistent ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {fmeaValidation.isConsistent ? "FMEA consistent with PLr" : "Discrepancies detected"}
              </div>
              <div className="flex items-center gap-3 ml-auto text-[10px] font-mono text-muted-foreground">
                <span>Max Sev: {fmeaValidation.maxSeverity}/10</span>
                <span>Avg Occ: {fmeaValidation.avgOccurrence}/10</span>
                <span>Avg Det: {fmeaValidation.avgDetection}/10</span>
                <span>Max RPN: {fmeaValidation.maxRpn}</span>
              </div>
            </div>

            {showValidation && (
              <div className="mt-3 space-y-1">
                {fmeaValidation.findings.map((finding, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className={finding.startsWith("WARNING") ? "text-risk-high" : "text-muted-foreground"}>
                      {finding.startsWith("WARNING") ? "⚠" : "✓"}
                    </span>
                    <span className={finding.startsWith("WARNING") ? "text-risk-high" : "text-muted-foreground"}>
                      {finding}
                    </span>
                  </div>
                ))}
                <p className="text-[10px] font-mono text-muted-foreground/70 italic mt-2">
                  Note: FMEA validates design adequacy — it does NOT determine PLr. PLr is determined solely from hazard context (S, F, P) per ISO 13849-1 §4.3.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Safety Functions Table */}
      <div className="border rounded-sm overflow-hidden">
        <table className="w-full text-xs table-zebra">
          <thead>
            <tr className="bg-muted">
              <th className="px-3 py-2 text-left font-semibold">Safety Function</th>
              <th className="px-3 py-2 text-center font-mono font-semibold">PLr</th>
              <th className="px-3 py-2 text-center font-mono font-semibold">Cat.</th>
              <th className="px-3 py-2 text-left font-semibold">Description</th>
              {onDelete && <th className="px-2 py-2 w-8"></th>}
            </tr>
          </thead>
          <tbody>
            {functions.map((sf) => (
              <tr key={sf.id} className="border-t border-border group">
                <td className="px-3 py-1.5 font-medium">
                  <EditableCell value={sf.function} onSave={v => onUpdate?.(sf.id, { function: v })} />
                </td>
                <td className="px-3 py-1.5 text-center">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-sm font-mono font-bold text-xs ${plrColors[sf.plr] ?? ""}`}>
                    {sf.plr.toUpperCase()}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-center font-mono">
                  <EditableCell value={sf.category} onSave={v => onUpdate?.(sf.id, { category: v })} />
                </td>
                <td className="px-3 py-1.5 text-muted-foreground">
                  <EditableCell value={sf.description} onSave={v => onUpdate?.(sf.id, { description: v })} />
                </td>
                {onDelete && (
                  <td className="px-2 py-1.5">
                    <button type="button" onClick={() => onDelete(sf.id)} className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onAdd && (
        <button type="button" onClick={handleAdd} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1">
          <Plus className="h-3.5 w-3.5" /> Add safety function
        </button>
      )}
    </div>
  );
}
