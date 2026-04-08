import { Shield } from "lucide-react";
import { silPlMappings } from "@/utils/silPlCrossRef";

interface SILPLTableProps {
  highlightPlr?: string;
}

export function SILPLTable({ highlightPlr }: SILPLTableProps) {
  return (
    <div className="border border-border/50 rounded bg-card/60 backdrop-blur-sm p-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
        <Shield className="h-3.5 w-3.5" />
        SIL / PL Cross-Reference (ISO 13849-1 / IEC 62061)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] table-zebra">
          <thead>
            <tr className="bg-muted">
              <th className="px-3 py-1.5 text-left font-semibold font-mono">PLr</th>
              <th className="px-3 py-1.5 text-left font-semibold font-mono">SIL (IEC 62061)</th>
              <th className="px-3 py-1.5 text-center font-semibold font-mono">Category</th>
              <th className="px-3 py-1.5 text-left font-semibold font-mono">PFH Range</th>
              <th className="px-3 py-1.5 text-left font-semibold">Architecture</th>
              <th className="px-3 py-1.5 text-left font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            {silPlMappings.map(row => {
              const isHighlighted = highlightPlr === row.plr;
              return (
                <tr
                  key={row.plr}
                  className={`border-t border-border ${isHighlighted ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}
                >
                  <td className="px-3 py-1.5 font-mono font-bold text-xs">{row.plr.toUpperCase()}</td>
                  <td className="px-3 py-1.5 font-mono font-semibold">{row.sil}</td>
                  <td className="px-3 py-1.5 text-center font-mono font-semibold">{row.category}</td>
                  <td className="px-3 py-1.5 font-mono text-muted-foreground">{row.pfhRange}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{row.architectureRequirement}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{row.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[9px] text-muted-foreground italic">
        Mapping per ISO 13849-1:2023 Annex and IEC 62061:2021. PFH = Probability of dangerous Failure per Hour.
      </p>
    </div>
  );
}
