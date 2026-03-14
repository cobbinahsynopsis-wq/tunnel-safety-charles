import type { SafetyFunction } from "@/data/systems";

const plrColors: Record<string, string> = {
  a: "bg-risk-low/20 text-risk-low",
  b: "bg-risk-low/20 text-risk-low",
  c: "bg-risk-medium/20 text-risk-medium",
  d: "bg-risk-high/20 text-risk-high",
  e: "bg-risk-critical/20 text-risk-critical",
};

export function SafetyFunctionsTable({ functions }: { functions: SafetyFunction[] }) {
  return (
    <div className="border rounded-sm overflow-hidden">
      <table className="w-full text-xs table-zebra">
        <thead>
          <tr className="bg-muted">
            <th className="px-3 py-2 text-left font-semibold">Safety Function</th>
            <th className="px-3 py-2 text-center font-mono font-semibold">PLr</th>
            <th className="px-3 py-2 text-center font-mono font-semibold">Cat.</th>
            <th className="px-3 py-2 text-left font-semibold">Description</th>
          </tr>
        </thead>
        <tbody>
          {functions.map((sf) => (
            <tr key={sf.id} className="border-t border-border">
              <td className="px-3 py-1.5 font-medium">{sf.function}</td>
              <td className="px-3 py-1.5 text-center">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-sm font-mono font-bold text-xs ${plrColors[sf.plr] || ""}`}>
                  {sf.plr}
                </span>
              </td>
              <td className="px-3 py-1.5 text-center font-mono">{sf.category}</td>
              <td className="px-3 py-1.5 text-muted-foreground">{sf.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
