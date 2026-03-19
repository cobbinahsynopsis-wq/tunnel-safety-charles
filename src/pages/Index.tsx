import { Link } from "react-router-dom";
import { machineInfo } from "@/data/systems";
import { useSystems } from "@/context/SystemsContext";
import { RiskBadge } from "@/components/RiskBadge";
import { EngineerMetadata } from "@/components/EngineerMetadata";
import { PerformanceLevelGraph } from "@/components/PerformanceLevelGraph";
import { exportOverviewPDF } from "@/utils/pdfExport";
import { Shield, Disc3, TriangleAlert, Navigation, Flame, Zap, ArrowRight, FileDown } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Disc3, TriangleAlert, Navigation, Flame, Zap,
};

export default function Index() {
  const { systems, metadata } = useSystems();
  const totalRisks = systems.reduce((acc, s) => acc + s.risks.length, 0);
  const criticalRisks = systems.reduce((acc, s) => acc + s.risks.filter(r => r.riskLevel === "critical").length, 0);
  const highRisks = systems.reduce((acc, s) => acc + s.risks.filter(r => r.riskLevel === "high").length, 0);
  const totalFMEA = systems.reduce((acc, s) => acc + s.fmea.length, 0);
  const totalSafety = systems.reduce((acc, s) => acc + s.safetyFunctions.length, 0);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded border border-primary/20 bg-card/80 backdrop-blur-sm p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">TSP/MSV Safety Analysis</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Interactive Failure Mode & Effects Analysis (FMEA) and Fault Tree Analysis (FTA) for a Tunnel
              Moving System. Edit RPN values, add new failure modes, and export your data.
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportOverviewPDF(systems, metadata)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0"
          >
            <FileDown className="h-4 w-4" /> Export PDF Report
          </button>
        </div>
      </div>

      {/* Engineer Metadata */}
      <EngineerMetadata />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPIBox label="TOTAL FAILURE MODES" value={totalFMEA} sub={`across ${systems.length} subsystems`} />
        <KPIBox label="CRITICAL RISK (RPN≥200)" value={criticalRisks} sub="require immediate action" variant="critical" />
        <KPIBox label="HIGH RISK (RPN 120-199)" value={highRisks} sub="require priority action" variant="high" />
        <KPIBox label="MAXIMUM RPN" value={Math.max(...systems.flatMap(s => s.fmea.map(f => f.rpn)), 0)} sub="highest severity" />
        <KPIBox label="SAFETY FUNCTIONS" value={totalSafety} sub="ISO 13849 evaluated" />
      </div>

      {/* Machine Specs */}
      <div className="border border-border/50 rounded bg-card/60 backdrop-blur-sm p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Machine Specifications</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-xs">
          {Object.entries({
            "Load Capacity": machineInfo.loadCapacity,
            "Propulsion": machineInfo.propulsion,
            "Configuration": `${machineInfo.axles}`,
            "Operator Cabins": machineInfo.cabins,
            "Traction": machineInfo.tractionSystem,
            "Braking": machineInfo.brakingSystems,
            "Steering": machineInfo.steering,
            "Guidance": machineInfo.guidance,
          }).map(([key, value]) => (
            <div key={key} className="flex justify-between border-b border-border/30 pb-1">
              <span className="text-muted-foreground">{key}</span>
              <span className="font-mono font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Level Graph */}
      <PerformanceLevelGraph systems={systems} />

      {/* System Cards */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Critical Systems Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {systems.map((system) => {
            const Icon = iconMap[system.icon] ?? Zap;
            const sysCritical = system.risks.filter(r => r.riskLevel === "critical").length;
            const sysHigh = system.risks.filter(r => r.riskLevel === "high").length;
            const maxRpn = system.fmea.length > 0 ? Math.max(...system.fmea.map(f => f.rpn)) : 0;

            return (
              <Link
                key={system.id}
                to={`/system/${system.id}`}
                className="border border-border/50 rounded bg-card/60 backdrop-blur-sm p-4 hover:border-primary/40 hover:bg-card/80 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{system.name}</h3>
                      <span className="text-[10px] font-mono text-muted-foreground">{system.nameFr}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2">{system.description}</p>

                <div className="mt-3 pt-2 border-t border-border/30 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    {sysCritical > 0 && <RiskBadge level="critical" />}
                    {sysHigh > 0 && <RiskBadge level="high" />}
                    {sysCritical === 0 && sysHigh === 0 && <RiskBadge level="medium" />}
                  </div>
                  <div className="flex items-center gap-3 font-mono text-muted-foreground">
                    <span>RPN max: {maxRpn}</span>
                    <span>{system.fmea.length} failures</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Risk Legend */}
      <div className="flex items-center gap-4 text-[10px] font-mono">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-risk-critical" /> CRITICAL (RPN≥200)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-risk-high" /> HIGH (120-199)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-risk-medium" /> MEDIUM (80-119)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-risk-low" /> LOW (&lt;80)</span>
      </div>

      {/* Standards */}
      <div className="border border-border/50 rounded bg-card/60 backdrop-blur-sm p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Applicable Standards</h2>
        <div className="flex gap-3 flex-wrap">
          {machineInfo.standards.map((std) => (
            <div key={std} className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border/50 rounded-sm">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-mono font-medium">{std}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPIBox({ label, value, sub, variant }: { label: string; value: number; sub: string; variant?: "critical" | "high" }) {
  const borderClass = variant === "critical" ? "border-risk-critical/30" : variant === "high" ? "border-risk-high/30" : "border-border/50";
  const valueClass = variant === "critical" ? "text-risk-critical" : variant === "high" ? "text-risk-high" : "text-foreground";

  return (
    <div className={`border ${borderClass} rounded bg-card/60 backdrop-blur-sm p-3`}>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">{label}</p>
      <p className={`text-3xl font-mono font-bold mt-1 ${valueClass}`}>{value}</p>
      <p className="text-[9px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
