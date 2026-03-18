import { useState, useMemo } from "react";
import { useSystems } from "@/context/SystemsContext";
import type { SystemData, FaultTreeNode, RiskLevel } from "@/data/systems";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap,
} from "recharts";
import { RiskBadge } from "./RiskBadge";
import { AlertTriangle, Shield, Activity, TrendingUp, Filter, BarChart3, Zap, Download } from "lucide-react";
import { downloadExcel } from "@/utils/excelExport";

function countNodes(node: FaultTreeNode): number {
  let count = 1;
  if (node.children) node.children.forEach(c => { count += countNodes(c); });
  return count;
}

function countBasicEvents(node: FaultTreeNode): number {
  if (!node.children || node.children.length === 0) return 1;
  let count = 0;
  node.children.forEach(c => { count += countBasicEvents(c); });
  return count;
}

function rpnLevel(rpn: number): RiskLevel {
  if (rpn >= 40) return "critical";
  if (rpn >= 25) return "high";
  if (rpn >= 15) return "medium";
  return "low";
}

const COLORS = {
  critical: "hsl(0, 72%, 51%)",
  high: "hsl(30, 100%, 50%)",
  medium: "hsl(45, 93%, 47%)",
  low: "hsl(160, 84%, 39%)",
  primary: "hsl(30, 100%, 50%)",
  secondary: "hsl(210, 15%, 35%)",
  accent1: "hsl(262, 83%, 58%)",
  accent2: "hsl(190, 90%, 45%)",
  accent3: "hsl(330, 70%, 50%)",
};

const SYSTEM_COLORS = [COLORS.primary, COLORS.high, COLORS.accent1, COLORS.accent3, COLORS.accent2];

export function PowerBIDashboard() {
  const { systems } = useSystems();
  const [selectedSystem, setSelectedSystem] = useState<string>("all");

  const filtered = useMemo(() => {
    if (selectedSystem === "all") return systems;
    return systems.filter(s => s.id === selectedSystem);
  }, [systems, selectedSystem]);

  const allFmea = filtered.flatMap(s => s.fmea.map(f => ({ ...f, systemName: s.name, systemId: s.id })));
  const allRisks = filtered.flatMap(s => s.risks.map(r => ({ ...r, systemName: s.name })));

  const totalComponents = allFmea.length;
  const totalRisks = allRisks.length;
  const criticalRisks = allRisks.filter(r => r.riskLevel === "critical").length;
  const highRisks = allRisks.filter(r => r.riskLevel === "high").length;
  const maxRpn = allFmea.length > 0 ? Math.max(...allFmea.map(f => f.rpn)) : 0;
  const avgRpn = allFmea.length > 0 ? Math.round(allFmea.reduce((a, f) => a + f.rpn, 0) / allFmea.length) : 0;
  const totalBasicEvents = filtered.reduce((a, s) => a + countBasicEvents(s.faultTree), 0);
  const totalSafetyFn = filtered.reduce((a, s) => a + s.safetyFunctions.length, 0);

  // RPN by system
  const rpnBySystem = systems.map((s, i) => ({
    name: s.name.replace(" System", "").replace(" Monitoring", ""),
    maxRpn: s.fmea.length > 0 ? Math.max(...s.fmea.map(f => f.rpn)) : 0,
    avgRpn: s.fmea.length > 0 ? Math.round(s.fmea.reduce((a, f) => a + f.rpn, 0) / s.fmea.length) : 0,
    count: s.fmea.length,
    color: SYSTEM_COLORS[i % SYSTEM_COLORS.length],
  }));

  // Risk distribution pie
  const riskDistribution = [
    { name: "Critical", value: allRisks.filter(r => r.riskLevel === "critical").length, color: COLORS.critical },
    { name: "High", value: allRisks.filter(r => r.riskLevel === "high").length, color: COLORS.high },
    { name: "Medium", value: allRisks.filter(r => r.riskLevel === "medium").length, color: COLORS.medium },
    { name: "Low", value: allRisks.filter(r => r.riskLevel === "low").length, color: COLORS.low },
  ].filter(d => d.value > 0);

  // Top 10 RPN components
  const topRpn = [...allFmea].sort((a, b) => b.rpn - a.rpn).slice(0, 10);

  // Radar data
  const radarData = systems.map(s => ({
    system: s.name.replace(" System", "").replace(" Monitoring", ""),
    "FMEA Items": s.fmea.length,
    "Risk Entries": s.risks.length,
    "Safety Functions": s.safetyFunctions.length * 3,
    "Basic Events": countBasicEvents(s.faultTree),
  }));

  // 5x5 heatmap data
  const heatmapData: { s: number; p: number; count: number; level: RiskLevel }[] = [];
  for (let s = 1; s <= 5; s++) {
    for (let p = 1; p <= 5; p++) {
      const count = allRisks.filter(r => r.severity === s && r.probability === p).length;
      const score = s * p;
      const level: RiskLevel = score >= 16 ? "critical" : score >= 9 ? "high" : score >= 4 ? "medium" : "low";
      heatmapData.push({ s, p, count, level });
    }
  }

  // RPN distribution by severity
  const severityDist = [1, 2, 3, 4, 5].map(sev => ({
    severity: `S=${sev}`,
    count: allFmea.filter(f => f.severity === sev).length,
    avgRpn: allFmea.filter(f => f.severity === sev).length > 0
      ? Math.round(allFmea.filter(f => f.severity === sev).reduce((a, f) => a + f.rpn, 0) / allFmea.filter(f => f.severity === sev).length)
      : 0,
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Power BI Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">Interactive Risk Analysis — ISO 12100 / ISO 13849</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadExcel}
            className="flex items-center gap-1.5 text-xs border border-border rounded-sm px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
          >
            <Download className="h-3.5 w-3.5" />
            Export Excel
          </button>
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={selectedSystem}
            onChange={e => setSelectedSystem(e.target.value)}
            className="text-xs border border-border rounded-sm px-2 py-1.5 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Systems</option>
            {systems.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.nameFr})</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        <KPICard label="Systems" value={filtered.length} icon={<Activity className="h-3.5 w-3.5" />} />
        <KPICard label="FMEA Items" value={totalComponents} icon={<TrendingUp className="h-3.5 w-3.5" />} />
        <KPICard label="Total Risks" value={totalRisks} />
        <KPICard label="Critical" value={criticalRisks} variant="critical" />
        <KPICard label="High" value={highRisks} variant="high" />
        <KPICard label="Max RPN" value={maxRpn} variant={maxRpn >= 40 ? "critical" : maxRpn >= 25 ? "high" : "default"} />
        <KPICard label="Avg RPN" value={avgRpn} />
        <KPICard label="Basic Events" value={totalBasicEvents} icon={<Zap className="h-3.5 w-3.5" />} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* RPN by System */}
        <div className="border rounded-sm bg-card p-3 lg:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">RPN by System</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rpnBySystem} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4, background: "hsl(220, 25%, 11%)", border: "1px solid hsl(220, 20%, 18%)", color: "hsl(210, 20%, 90%)" }} />
              <Bar dataKey="maxRpn" name="Max RPN" radius={[2, 2, 0, 0]}>
                {rpnBySystem.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
              <Bar dataKey="avgRpn" name="Avg RPN" radius={[2, 2, 0, 0]} fill="hsl(215, 16%, 70%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution Pie */}
        <div className="border rounded-sm bg-card p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {riskDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 2 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* 5x5 Risk Heatmap */}
        <div className="border rounded-sm bg-card p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">5×5 Risk Heatmap</h3>
          <div className="overflow-x-auto">
            <table className="text-[10px] border-collapse w-full">
              <thead>
                <tr>
                  <th className="px-1 py-1 text-right font-mono text-muted-foreground">Sev\Prob</th>
                  {[1, 2, 3, 4, 5].map(p => (
                    <th key={p} className="px-1 py-1 text-center font-mono w-14">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[5, 4, 3, 2, 1].map(s => (
                  <tr key={s}>
                    <td className="px-1 py-1 text-right font-mono font-semibold">{s}</td>
                    {[1, 2, 3, 4, 5].map(p => {
                      const cell = heatmapData.find(h => h.s === s && h.p === p)!;
                      const bgColor = cell.level === "critical" ? "bg-risk-critical/30" : cell.level === "high" ? "bg-risk-high/30" : cell.level === "medium" ? "bg-risk-medium/30" : "bg-risk-low/30";
                      const borderColor = cell.level === "critical" ? "border-risk-critical/50" : cell.level === "high" ? "border-risk-high/50" : cell.level === "medium" ? "border-risk-medium/50" : "border-risk-low/50";
                      return (
                        <td key={p} className={`px-1 py-2 text-center border ${bgColor} ${borderColor} font-mono`}>
                          <div className="text-[9px] uppercase font-semibold opacity-70">{cell.level}</div>
                          {cell.count > 0 && <div className="text-xs font-bold mt-0.5">{cell.count}</div>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 10 RPN */}
        <div className="border rounded-sm bg-card p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">Top 10 RPN Components</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topRpn} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis dataKey="component" type="category" width={120} tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 2 }} formatter={(value: number) => [`RPN: ${value}`]} />
              <Bar dataKey="rpn" radius={[0, 2, 2, 0]}>
                {topRpn.map((entry, i) => (
                  <Cell key={i} fill={
                    entry.rpn >= 40 ? COLORS.critical :
                    entry.rpn >= 25 ? COLORS.high :
                    entry.rpn >= 15 ? COLORS.medium : COLORS.low
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Radar */}
        <div className="border rounded-sm bg-card p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">System Complexity Radar</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(214, 32%, 91%)" />
              <PolarAngleAxis dataKey="system" tick={{ fontSize: 9 }} />
              <PolarRadiusAxis tick={{ fontSize: 8 }} />
              <Radar name="FMEA Items" dataKey="FMEA Items" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.2} />
              <Radar name="Risk Entries" dataKey="Risk Entries" stroke={COLORS.high} fill={COLORS.high} fillOpacity={0.2} />
              <Radar name="Basic Events" dataKey="Basic Events" stroke={COLORS.accent1} fill={COLORS.accent1} fillOpacity={0.2} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution */}
        <div className="border rounded-sm bg-card p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">FMEA Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={severityDist}>
              <XAxis dataKey="severity" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 2 }} />
              <Bar dataKey="count" name="Components" fill={COLORS.primary} radius={[2, 2, 0, 0]} />
              <Bar dataKey="avgRpn" name="Avg RPN" fill={COLORS.accent2} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FMEA Detail Table */}
      <div className="border rounded-sm bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">
          FMEA Detail — {selectedSystem === "all" ? "All Systems" : filtered[0]?.name}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted text-left">
                {selectedSystem === "all" && <th className="px-2 py-1.5 font-semibold">System</th>}
                <th className="px-2 py-1.5 font-semibold">Component</th>
                <th className="px-2 py-1.5 font-semibold">Failure Mode</th>
                <th className="px-2 py-1.5 font-semibold">Cause</th>
                <th className="px-2 py-1.5 text-center font-mono font-semibold">S</th>
                <th className="px-2 py-1.5 text-center font-mono font-semibold">O</th>
                <th className="px-2 py-1.5 text-center font-mono font-semibold">D</th>
                <th className="px-2 py-1.5 text-center font-mono font-semibold">RPN</th>
                <th className="px-2 py-1.5 font-semibold">Risk</th>
                <th className="px-2 py-1.5 font-semibold">Mitigation</th>
              </tr>
            </thead>
            <tbody>
              {[...allFmea].sort((a, b) => b.rpn - a.rpn).slice(0, 20).map(row => (
                <tr key={row.id} className="border-t border-border hover:bg-accent/50">
                  {selectedSystem === "all" && <td className="px-2 py-1 font-medium text-primary">{row.systemName.replace(" System", "")}</td>}
                  <td className="px-2 py-1 font-medium">{row.component}</td>
                  <td className="px-2 py-1">{row.failureMode}</td>
                  <td className="px-2 py-1 text-muted-foreground">{row.cause}</td>
                  <td className="px-2 py-1 text-center font-mono">{row.severity}</td>
                  <td className="px-2 py-1 text-center font-mono">{row.occurrence}</td>
                  <td className="px-2 py-1 text-center font-mono">{row.detection}</td>
                  <td className="px-2 py-1 text-center font-mono font-bold">{row.rpn}</td>
                  <td className="px-2 py-1"><RiskBadge level={rpnLevel(row.rpn)} /></td>
                  <td className="px-2 py-1 text-muted-foreground max-w-[200px] truncate">{row.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fault Tree Summary */}
      <div className="border rounded-sm bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">Fault Tree Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((sys, i) => (
            <div key={sys.id} className="border rounded-sm p-3 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold">{sys.name}</h4>
                <span className="text-[10px] font-mono text-muted-foreground">{countNodes(sys.faultTree)} nodes</span>
              </div>
              <div className="text-[10px] text-risk-critical font-medium mb-1">TOP: {sys.faultTree.label}</div>
              <div className="space-y-0.5">
                {sys.faultTree.children?.map(child => (
                  <div key={child.id} className="flex items-center gap-1 text-[10px]">
                    {child.gateType && (
                      <span className="px-1 py-0.5 bg-primary/10 text-primary font-mono rounded-sm text-[8px] font-bold">{child.gateType}</span>
                    )}
                    <span className="text-muted-foreground">{child.code && `[${child.code}]`}</span>
                    <span className="truncate">{child.label}</span>
                    {child.children && (
                      <span className="text-[9px] font-mono text-muted-foreground ml-auto">({countBasicEvents(child)} events)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, icon, variant = "default" }: { label: string; value: number | string; icon?: React.ReactNode; variant?: "default" | "critical" | "high" }) {
  const bg = variant === "critical" ? "bg-risk-critical/10 border-risk-critical/30" : variant === "high" ? "bg-risk-high/10 border-risk-high/30" : "border-border bg-card";
  const textColor = variant === "critical" ? "text-risk-critical" : variant === "high" ? "text-risk-high" : "text-foreground";

  return (
    <div className={`border rounded-sm p-2.5 ${bg}`}>
      <div className="flex items-center gap-1">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className={`text-xl font-mono font-bold mt-0.5 ${textColor}`}>{value}</p>
    </div>
  );
}
