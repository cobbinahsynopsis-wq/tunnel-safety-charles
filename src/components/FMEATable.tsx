import type { FMEARow } from "@/data/systems";
import { RiskBadge } from "./RiskBadge";
import type { RiskLevel } from "@/data/systems";

function rpnLevel(rpn: number): RiskLevel {
  if (rpn >= 40) return "critical";
  if (rpn >= 25) return "high";
  if (rpn >= 15) return "medium";
  return "low";
}

export function FMEATable({ rows }: { rows: FMEARow[] }) {
  const sorted = [...rows].sort((a, b) => b.rpn - a.rpn);

  return (
    <div className="overflow-x-auto border rounded-sm">
      <table className="w-full text-xs table-zebra">
        <thead>
          <tr className="bg-muted text-left">
            <th className="px-3 py-2 font-semibold">Component</th>
            <th className="px-3 py-2 font-semibold">Failure Mode</th>
            <th className="px-3 py-2 font-semibold">Cause</th>
            <th className="px-3 py-2 font-semibold">Effect</th>
            <th className="px-3 py-2 font-semibold text-center font-mono">S</th>
            <th className="px-3 py-2 font-semibold text-center font-mono">O</th>
            <th className="px-3 py-2 font-semibold text-center font-mono">D</th>
            <th className="px-3 py-2 font-semibold text-center font-mono">RPN</th>
            <th className="px-3 py-2 font-semibold">Risk</th>
            <th className="px-3 py-2 font-semibold">Mitigation</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.id} className="border-t border-border">
              <td className="px-3 py-1.5 font-medium">{row.component}</td>
              <td className="px-3 py-1.5">{row.failureMode}</td>
              <td className="px-3 py-1.5 text-muted-foreground">{row.cause}</td>
              <td className="px-3 py-1.5">{row.effect}</td>
              <td className="px-3 py-1.5 text-center font-mono">{row.severity}</td>
              <td className="px-3 py-1.5 text-center font-mono">{row.occurrence}</td>
              <td className="px-3 py-1.5 text-center font-mono">{row.detection}</td>
              <td className="px-3 py-1.5 text-center font-mono font-bold">{row.rpn}</td>
              <td className="px-3 py-1.5"><RiskBadge level={rpnLevel(row.rpn)} /></td>
              <td className="px-3 py-1.5 text-muted-foreground max-w-[200px]">{row.mitigation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
