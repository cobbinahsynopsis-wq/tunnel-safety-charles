import type { FaultTreeNode } from "@/data/systems";
import { useState, useCallback } from "react";
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

function generateChildCode(parent: FaultTreeNode): string {
  const parentCode = parent.code ?? "";
  const childCount = parent.children?.length ?? 0;
  const nextIndex = childCount + 1;

  if (parentCode) {
    return `${parentCode}.${nextIndex}`;
  }
  return String(nextIndex);
}

interface GateSelectorProps {
  onSelect: (gate: "AND" | "OR") => void;
  onCancel: () => void;
}

function GateSelector({ onSelect, onCancel }: GateSelectorProps) {
  return (
    <div className="flex items-center gap-1 ml-2 animate-in fade-in-0 zoom-in-95">
      <button
        type="button"
        onClick={() => onSelect("OR")}
        className="px-2 py-1 text-[10px] font-mono font-bold rounded-sm bg-risk-high/20 text-risk-high border border-risk-high/30 hover:bg-risk-high/30 transition-colors"
      >
        OR
      </button>
      <button
        type="button"
        onClick={() => onSelect("AND")}
        className="px-2 py-1 text-[10px] font-mono font-bold rounded-sm bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors"
      >
        AND
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-1.5 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        ✕
      </button>
    </div>
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
  const expanded = true;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.label);
  const [showGateSelector, setShowGateSelector] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const commitEdit = useCallback(() => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== node.label) {
      onUpdate?.(node.id, { label: trimmed });
    }
  }, [draft, node.label, node.id, onUpdate]);

  const handleAddRequest = useCallback(() => {
    const hasExistingChildren = node.children && node.children.length > 0;
    if (hasExistingChildren) {
      // Node already has children — ask for gate type between siblings
      setShowGateSelector(true);
    } else {
      // First child — add directly without gate selector
      const childCode = generateChildCode(node);
      const child: FaultTreeNode = {
        id: `ft-${Date.now()}`,
        label: "New event",
        type: "basic",
        code: childCode,
      };
      if (node.type === "basic" && onUpdate) {
        onUpdate(node.id, { type: "gate" });
      }
      onAddChild?.(node.id, child);
      setExpanded(true);
    }
  }, [node, onUpdate, onAddChild]);

  const handleGateSelect = useCallback(
    (gate: "AND" | "OR") => {
      setShowGateSelector(false);
      const childCode = generateChildCode(node);
      const child: FaultTreeNode = {
        id: `ft-${Date.now()}`,
        label: "New event",
        type: "basic",
        code: childCode,
      };

      // Set or update the parent's gate type
      if (onUpdate) {
        onUpdate(node.id, { gateType: gate, type: node.type === "basic" ? "gate" : node.type });
      }

      onAddChild?.(node.id, child);
      setExpanded(true);
    },
    [node, onUpdate, onAddChild],
  );

  const toggleGate = useCallback(() => {
    if (node.gateType && onUpdate) {
      onUpdate(node.id, { gateType: node.gateType === "AND" ? "OR" : "AND" });
    }
  }, [node.gateType, node.id, onUpdate]);

  return (
    <div className="relative">
      {depth > 0 && (
        <div className="absolute left-0 top-0 w-4 h-3 border-l-2 border-b-2 border-border -translate-x-0" />
      )}

      <div className={depth > 0 ? "ml-4" : ""}>
        <div className="flex items-center gap-1 group">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs border rounded-sm transition-colors ${nodeStyles[node.type]} cursor-default`}
          >
            {node.gateType && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGate();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    toggleGate();
                  }
                }}
                className="cursor-pointer"
                title="Click to toggle AND/OR"
              >
                <GateSymbol type={node.gateType} />
              </span>
            )}
            {editing ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") {
                    setDraft(node.label);
                    setEditing(false);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-background border border-ring rounded-sm px-1 py-0.5 text-xs outline-none min-w-[120px]"
              />
            ) : (
              <span className="text-left leading-tight">
                {node.code && (
                  <span className="font-mono text-primary/70 mr-1">[{node.code}]</span>
                )}
                {node.label}
              </span>
            )}
            {node.type === "basic" && (
              <span className="ml-1 w-2 h-2 rounded-full bg-risk-medium shrink-0" />
            )}
          </button>

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
            <button
              type="button"
              onClick={() => {
                setDraft(node.label);
                setEditing(true);
              }}
              className="p-0.5 text-muted-foreground hover:text-foreground"
              title="Edit label"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={handleAddRequest}
              className="p-0.5 text-muted-foreground hover:text-primary"
              title="Add child node"
            >
              <Plus className="h-3 w-3" />
            </button>
            {node.type !== "top" && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(node.id)}
                className="p-0.5 text-muted-foreground hover:text-destructive"
                title="Delete node"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>

          {showGateSelector && (
            <GateSelector
              onSelect={handleGateSelect}
              onCancel={() => setShowGateSelector(false)}
            />
          )}
        </div>

        {expanded && hasChildren && (
          <div className="ml-4 mt-1 pl-3 border-l-2 border-border space-y-1">
            {node.children?.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                onUpdate={onUpdate}
                onAddChild={onAddChild}
                onDelete={onDelete}
              />
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
