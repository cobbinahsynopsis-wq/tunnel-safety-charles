import type { FaultTreeNode } from "@/data/systems";
import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil } from "lucide-react";

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

interface TreeNodeProps {
  node: FaultTreeNode;
  depth?: number;
  onUpdate?: (nodeId: string, updates: Partial<FaultTreeNode>) => void;
  onAddChild?: (parentId: string, child: FaultTreeNode) => void;
  onDelete?: (nodeId: string) => void;
}

function TreeNode({ node, depth = 0, onUpdate, onAddChild, onDelete }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.label);
  const hasChildren = node.children && node.children.length > 0;

  const commitEdit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== node.label) onUpdate?.(node.id, { label: draft.trim() });
  };

  const handleAddChild = () => {
    onAddChild?.(node.id, {
      id: `ft-${Date.now()}`,
      label: "New event",
      type: "basic",
    });
    setExpanded(true);
  };

  const toggleGate = () => {
    if (node.gateType) onUpdate?.(node.id, { gateType: node.gateType === "AND" ? "OR" : "AND" });
  };

  return (
    <div className="relative">
      {depth > 0 && (
        <div className="absolute left-0 top-0 w-4 h-3 border-l-2 border-b-2 border-border -translate-x-0" />
      )}

      <div className={`ml-${depth > 0 ? 4 : 0}`}>
        <div className="flex items-center gap-1 group">
          <button
            onClick={() => hasChildren && setExpanded(!expanded)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs border rounded-sm transition-colors ${nodeStyles[node.type]} ${hasChildren ? "cursor-pointer hover:shadow-sm" : "cursor-default"}`}
          >
            {hasChildren && (
              expanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />
            )}
            {node.gateType && (
              <span onClick={(e) => { e.stopPropagation(); toggleGate(); }} className="cursor-pointer" title="Click to toggle AND/OR">
                <GateSymbol type={node.gateType} />
              </span>
            )}
            {editing ? (
              <input
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") { setDraft(node.label); setEditing(false); } }}
                onClick={e => e.stopPropagation()}
                className="bg-background border border-ring rounded-sm px-1 py-0.5 text-xs outline-none min-w-[120px]"
              />
            ) : (
              <span className="text-left leading-tight">
                {node.code && <span className="font-mono text-primary/70 mr-1">[{node.code}]</span>}
                {node.label}
              </span>
            )}
            {node.type === "basic" && (
              <span className="ml-1 w-2 h-2 rounded-full bg-risk-medium shrink-0" />
            )}
          </button>

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
            <button onClick={() => { setDraft(node.label); setEditing(true); }} className="p-0.5 text-muted-foreground hover:text-foreground" title="Edit label">
              <Pencil className="h-3 w-3" />
            </button>
            <button onClick={handleAddChild} className="p-0.5 text-muted-foreground hover:text-primary" title="Add child">
              <Plus className="h-3 w-3" />
            </button>
            {node.type !== "top" && onDelete && (
              <button onClick={() => onDelete(node.id)} className="p-0.5 text-muted-foreground hover:text-destructive" title="Delete node">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {expanded && hasChildren && (
          <div className="ml-4 mt-1 pl-3 border-l-2 border-border space-y-1">
            {node.children!.map((child) => (
              <TreeNode key={child.id} node={child} depth={depth + 1} onUpdate={onUpdate} onAddChild={onAddChild} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface FaultTreeProps {
  tree: FaultTreeNode;
  onUpdateNode?: (nodeId: string, updates: Partial<FaultTreeNode>) => void;
  onAddChild?: (parentId: string, child: FaultTreeNode) => void;
  onDeleteNode?: (nodeId: string) => void;
}

export function FaultTree({ tree, onUpdateNode, onAddChild, onDeleteNode }: FaultTreeProps) {
  return (
    <div className="p-4 bg-card border rounded-sm overflow-auto">
      <TreeNode node={tree} onUpdate={onUpdateNode} onAddChild={onAddChild} onDelete={onDeleteNode} />
    </div>
  );
}
