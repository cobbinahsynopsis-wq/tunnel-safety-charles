import { useParams } from "react-router-dom";
import { useSystems } from "@/context/SystemsContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FMEATable } from "@/components/FMEATable";
import { RiskMatrix } from "@/components/RiskMatrix";
import { FaultTree } from "@/components/FaultTree";
import { SafetyFunctionsTable } from "@/components/SafetyFunctions";
import { EditableCell } from "@/components/EditableCell";
import { AlertTriangle, Shield, List, Plus, Trash2, FileDown } from "lucide-react";
import { useState } from "react";
import { getDefaultHazardContext, type HazardContext } from "@/utils/plrCalculation";
import { exportSystemPDF } from "@/utils/pdfExport";

function EditableList({
  items,
  onUpdate,
  onAdd,
  onDelete,
  accentClass,
  addLabel,
}: {
  items: string[];
  onUpdate: (index: number, value: string) => void;
  onAdd: (value: string) => void;
  onDelete: (index: number) => void;
  accentClass: string;
  addLabel: string;
}) {
  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 group text-xs text-muted-foreground">
          <span className={`${accentClass} mt-0.5`}>›</span>
          <div className="flex-1">
            <EditableCell value={item} onSave={v => onUpdate(i, v)} />
          </div>
          <button onClick={() => onDelete(i)} className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity shrink-0 mt-0.5" title="Delete">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button onClick={() => onAdd("New item")} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mt-1">
        <Plus className="h-3 w-3" /> {addLabel}
      </button>
    </div>
  );
}

export default function SystemAnalysis() {
  const { systemId } = useParams<{ systemId: string }>();
  const {
    systems, metadata, updateSystem,
    addFMEARow, updateFMEARow, deleteFMEARow,
    addRiskEntry, updateRiskEntry, deleteRiskEntry,
    addSafetyFunction, updateSafetyFunction, deleteSafetyFunction,
    addSafetyMeasure, updateSafetyMeasure, deleteSafetyMeasure,
    addConsequence, updateConsequence, deleteConsequence,
    updateFaultTreeNode, addFaultTreeChild, deleteFaultTreeNode,
  } = useSystems();

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
  const maxRpn = Math.max(...system.fmea.map((f) => f.rpn), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">
              <EditableCell value={system.name} onSave={v => updateSystem(systemId!, { name: v })} />
            </h1>
            <span className="text-xs font-mono text-muted-foreground px-1.5 py-0.5 bg-muted rounded-sm">
              <EditableCell value={system.nameFr} onSave={v => updateSystem(systemId!, { nameFr: v })} />
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            <EditableCell value={system.description} onSave={v => updateSystem(systemId!, { description: v })} />
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => exportSystemPDF(system, metadata, system.hazardContext ?? getDefaultHazardContext(systemId ?? ""))}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-sm text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <FileDown className="h-3.5 w-3.5" />
            Export PDF
          </button>
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
        <div className="flex-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Top Event</span>
          <p className="text-sm font-semibold">
            <EditableCell value={system.topEvent} onSave={v => updateSystem(systemId!, { topEvent: v })} />
          </p>
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
          <FaultTree
            tree={system.faultTree}
            onUpdateNode={(nodeId, updates) => updateFaultTreeNode(systemId!, nodeId, updates)}
            onAddChild={(parentId, child) => addFaultTreeChild(systemId!, parentId, child)}
            onDeleteNode={(nodeId) => deleteFaultTreeNode(systemId!, nodeId)}
          />
        </TabsContent>

        <TabsContent value="fmea" className="mt-3">
          <FMEATable
            rows={system.fmea}
            onUpdate={(rowId, updates) => updateFMEARow(systemId!, rowId, updates)}
            onAdd={(row) => addFMEARow(systemId!, row)}
            onDelete={(rowId) => deleteFMEARow(systemId!, rowId)}
          />
        </TabsContent>

        <TabsContent value="riskmatrix" className="mt-3">
          <RiskMatrix
            entries={system.risks}
            onUpdate={(entryId, updates) => updateRiskEntry(systemId!, entryId, updates)}
            onAdd={(entry) => addRiskEntry(systemId!, entry)}
            onDelete={(entryId) => deleteRiskEntry(systemId!, entryId)}
          />
        </TabsContent>

        <TabsContent value="plr" className="mt-3 space-y-4">
          <SafetyFunctionsTable
            functions={system.safetyFunctions}
            hazardContext={system.hazardContext ?? getDefaultHazardContext(systemId ?? "")}
            fmeaRows={system.fmea}
            faultTree={system.faultTree}
            onUpdate={(sfId, updates) => updateSafetyFunction(systemId!, sfId, updates)}
            onAdd={(sf) => addSafetyFunction(systemId!, sf)}
            onDelete={(sfId) => deleteSafetyFunction(systemId!, sfId)}
            onUpdateContext={(updates) => {
              const current = system.hazardContext ?? getDefaultHazardContext(systemId ?? "");
              updateSystem(systemId!, { hazardContext: { ...current, ...updates } });
            }}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-sm p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">Safety Measures</h3>
              </div>
              <EditableList
                items={system.safetyMeasures}
                onUpdate={(i, v) => updateSafetyMeasure(systemId!, i, v)}
                onAdd={(v) => addSafetyMeasure(systemId!, v)}
                onDelete={(i) => deleteSafetyMeasure(systemId!, i)}
                accentClass="text-primary"
                addLabel="Add measure"
              />
            </div>
            <div className="border rounded-sm p-3">
              <div className="flex items-center gap-2 mb-2">
                <List className="h-4 w-4 text-risk-high" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">Consequences</h3>
              </div>
              <EditableList
                items={system.consequences}
                onUpdate={(i, v) => updateConsequence(systemId!, i, v)}
                onAdd={(v) => addConsequence(systemId!, v)}
                onDelete={(i) => deleteConsequence(systemId!, i)}
                accentClass="text-risk-high"
                addLabel="Add consequence"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
