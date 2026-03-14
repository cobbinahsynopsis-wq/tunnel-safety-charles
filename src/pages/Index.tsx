import { Link } from "react-router-dom";
import { systems, machineInfo } from "@/data/systems";
import { RiskBadge } from "@/components/RiskBadge";
import { AlertTriangle, Shield, Disc3, TriangleAlert, Navigation, Flame, Zap, ArrowRight } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Disc3, TriangleAlert, Navigation, Flame, Zap,
};

export default function Index() {
  const totalRisks = systems.reduce((acc, s) => acc + s.risks.length, 0);
  const criticalRisks = systems.reduce((acc, s) => acc + s.risks.filter(r => r.riskLevel === "critical").length, 0);
  const highRisks = systems.reduce((acc, s) => acc + s.risks.filter(r => r.riskLevel === "high").length, 0);
  const totalFMEA = systems.reduce((acc, s) => acc + s.fmea.length, 0);
  const totalSafety = systems.reduce((acc, s) => acc + s.safetyFunctions.length, 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold">Machine Risk Analysis Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {machineInfo.name} — ISO 12100 Risk Assessment & ISO 13849 Performance Level Evaluation
        </p>
      </div>

      {/* Machine Specs */}
      <div className="border rounded-sm bg-card p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3">Machine Specifications</h2>
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
            <div key={key} className="flex justify-between border-b border-border/50 pb-1">
              <span className="text-muted-foreground">{key}</span>
              <span className="font-mono font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="border rounded-sm p-3 bg-card">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Systems</p>
          <p className="text-2xl font-mono font-bold mt-1">{systems.length}</p>
        </div>
        <div className="border rounded-sm p-3 bg-card">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Risks</p>
          <p className="text-2xl font-mono font-bold mt-1">{totalRisks}</p>
        </div>
        <div className="border rounded-sm p-3 bg-risk-critical/5 border-risk-critical/20">
          <p className="text-[10px] uppercase tracking-wider text-risk-critical">Critical</p>
          <p className="text-2xl font-mono font-bold mt-1 text-risk-critical">{criticalRisks}</p>
        </div>
        <div className="border rounded-sm p-3 bg-card">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">FMEA Items</p>
          <p className="text-2xl font-mono font-bold mt-1">{totalFMEA}</p>
        </div>
        <div className="border rounded-sm p-3 bg-card">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Safety Functions</p>
          <p className="text-2xl font-mono font-bold mt-1">{totalSafety}</p>
        </div>
      </div>

      {/* System Cards */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3">Critical Systems Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {systems.map((system) => {
            const Icon = iconMap[system.icon];
            const sysCritical = system.risks.filter(r => r.riskLevel === "critical").length;
            const sysHigh = system.risks.filter(r => r.riskLevel === "high").length;
            const maxRpn = Math.max(...system.fmea.map(f => f.rpn));

            return (
              <Link
                key={system.id}
                to={`/system/${system.id}`}
                className="border rounded-sm bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-sm bg-primary/10 flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{system.name}</h3>
                      <span className="text-[10px] font-mono text-muted-foreground">{system.nameFr}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2">{system.description}</p>

                <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[10px]">
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

      {/* Standards */}
      <div className="border rounded-sm bg-card p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-2">Applicable Standards</h2>
        <div className="flex gap-3">
          {machineInfo.standards.map((std) => (
            <div key={std} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-sm">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-mono font-medium">{std}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
