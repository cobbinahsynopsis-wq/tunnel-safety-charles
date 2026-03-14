import type { SafetyFunction } from "@/data/systems";
import { EditableCell } from "./EditableCell";
import { Plus, Trash2 } from "lucide-react";

const plrColors: Record<string, string> = {
  a: "bg-risk-low/20 text-risk-low",
  b: "bg-risk-low/20 text-risk-low",
  c: "bg-risk-medium/20 text-risk-medium",
  d: "bg-risk-high/20 text-risk-high",
  e: "bg-risk-critical/20 text-risk-critical",
};

interface SafetyFunctionsTableProps {
  functions: SafetyFunction[];
  onUpdate?: (sfId: string, updates: Partial<SafetyFunction>) => void;
  onAdd?: (sf: SafetyFunction) => void;
  onDelete?: (sfId: string) => void;
}

export function SafetyFunctionsTable({ functions, onUpdate, onAdd, onDelete }: SafetyFunctionsTableProps) {
  const handleAdd = () => {
    if (!onAdd) return;
    onAdd({
      id: `sf-${Date.now()}`,
      function: "New safety function",
      plr: "c",
      category: "2",
      description: "Description",
    });
  };

  return (
    <div className="space-y-2">
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
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-sm font-mono font-bold text-xs ${plrColors[sf.plr] || ""}`}>
                    <EditableCell value={sf.plr} onSave={v => onUpdate?.(sf.id, { plr: v.toLowerCase() })} />
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
                    <button onClick={() => onDelete(sf.id)} className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity" title="Delete">
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
        <button onClick={handleAdd} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1">
          <Plus className="h-3.5 w-3.5" /> Add safety function
        </button>
      )}
    </div>
  );
}
