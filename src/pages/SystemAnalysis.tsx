import { useParams } from "react-router-dom";
import { systems } from "@/data/systems";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FMEATable } from "@/components/FMEATable";
import { RiskMatrix } from "@/components/RiskMatrix";
import { FaultTree } from "@/components/FaultTree";
import { SafetyFunctionsTable } from "@/components/SafetyFunctions";
import { RiskBadge } from "@/components/RiskBadge";
import { AlertTriangle, Shield, List } from "lucide-react";

export default function SystemAnalysis() {
  const { systemId } = useParams<{ systemId: string }>();
  const system = systems.find((s) => s.id === systemId);

  if (!system) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        System not found
      </div>
    );
  }

  const criticalCount = system.risks.filter((r) => r.riskLevel === "critical").length;
  const highCount = system.risks.filter((r) => r.riskLevel === "high").length;
  const maxRpn = Math.max(...system.fmea.map((f) => f.rpn));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{system.name}</h1>
            <span className="text-xs font-mono text-muted-foreground px-1.5 py-0.5 bg-muted rounded-sm">
              {system.nameFr}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{system.description}</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-risk-critical" />
              <span className="font-mono">{criticalCount} Critical</span>
            </div>
          )}
          {highCount > 0 && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-risk-high" />
              <span className="font-mono">{highCount} High</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="font-mono">Max RPN: {maxRpn}</span>
          </div>
        </div>
      </div>

      {/* Top Event Banner */}
      <div className="bg-risk-critical/5 border border-risk-critical/20 rounded-sm px-4 py-2 flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-risk-critical shrink-0" />
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Top Event</span>
          <p className="text-sm font-semibold">{system.topEvent}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="faulttree" className="w-full">
        <TabsList className="bg-muted rounded-sm h-8">
          <TabsTrigger value="faulttree" className="text-xs rounded-sm data-[state=active]:bg-card">Fault Tree</TabsTrigger>
          <TabsTrigger value="fmea" className="text-xs rounded-sm data-[state=active]:bg-card">FMEA Table</TabsTrigger>
          <TabsTrigger value="riskmatrix" className="text-xs rounded-sm data-[state=active]:bg-card">Risk Matrix</TabsTrigger>
          <TabsTrigger value="plr" className="text-xs rounded-sm data-[state=active]:bg-card">PLr Evaluation</TabsTrigger>
        </TabsList>

        <TabsContent value="faulttree" className="mt-3">
          <FaultTree tree={system.faultTree} />
        </TabsContent>

        <TabsContent value="fmea" className="mt-3">
          <FMEATable rows={system.fmea} />
        </TabsContent>

        <TabsContent value="riskmatrix" className="mt-3">
          <RiskMatrix entries={system.risks} />
        </TabsContent>

        <TabsContent value="plr" className="mt-3 space-y-4">
          <SafetyFunctionsTable functions={system.safetyFunctions} />

          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-sm p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">Safety Measures</h3>
              </div>
              <ul className="space-y-1">
                {system.safetyMeasures.map((m, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">›</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border rounded-sm p-3">
              <div className="flex items-center gap-2 mb-2">
                <List className="h-4 w-4 text-risk-high" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">Consequences</h3>
              </div>
              <ul className="space-y-1">
                {system.consequences.map((c, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-risk-high mt-0.5">›</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
