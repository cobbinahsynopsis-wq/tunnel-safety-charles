import type { FaultTreeNode } from "@/data/systems";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const nodeStyles: Record<string, string> = {
  top: "bg-risk-critical text-primary-foreground font-semibold border-risk-critical",
  gate: "bg-card border-primary text-foreground font-medium",
  event: "bg-muted border-border text-foreground",
  basic: "bg-card border-secondary text-foreground",
};

function GateSymbol({ type }: { type: "AND" | "OR" }) {
  return (
    <span className="inline-flex items-center justify-center w-7 h-5 text-[9px] font-mono font-bold rounded-sm bg-primary/10 text-primary border border-primary/20 mx-1">
      {type}
    </span>
  );
}

function TreeNode({ node, depth = 0 }: { node: FaultTreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="relative">
      {/* Connector line */}
      {depth > 0 && (
        <div className="absolute left-0 top-0 w-4 h-3 border-l-2 border-b-2 border-border -translate-x-0" />
      )}

      <div className={`ml-${depth > 0 ? 4 : 0}`}>
        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs border rounded-sm transition-colors ${nodeStyles[node.type]} ${hasChildren ? "cursor-pointer hover:shadow-sm" : "cursor-default"}`}
        >
          {hasChildren && (
            expanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />
          )}
          {node.gateType && <GateSymbol type={node.gateType} />}
          <span className="text-left leading-tight">{node.label}</span>
          {node.type === "basic" && (
            <span className="ml-1 w-2 h-2 rounded-full bg-risk-medium shrink-0" />
          )}
        </button>

        {expanded && hasChildren && (
          <div className="ml-4 mt-1 pl-3 border-l-2 border-border space-y-1">
            {node.children!.map((child) => (
              <TreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function FaultTree({ tree }: { tree: FaultTreeNode }) {
  return (
    <div className="p-4 bg-card border rounded-sm overflow-auto">
      <TreeNode node={tree} />
    </div>
  );
}
