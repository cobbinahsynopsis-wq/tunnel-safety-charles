import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { systems as initialSystems, type SystemData, type FMEARow, type RiskEntry, type SafetyFunction, type FaultTreeNode, type RiskLevel } from "@/data/systems";
import { type AuditEntry, type AuditAction, loadAuditTrail, saveAuditTrail, createAuditEntry, clearAuditTrail } from "@/utils/auditTrail";

export interface AnalysisMetadata {
  engineerName: string;
  date: string;
  lastModified: string;
  notes: string;
}

interface SystemsContextType {
  systems: SystemData[];
  metadata: AnalysisMetadata;
  auditTrail: AuditEntry[];
  updateMetadata: (updates: Partial<AnalysisMetadata>) => void;
  updateSystem: (systemId: string, updates: Partial<SystemData>) => void;
  addSystem: (system: SystemData) => void;
  deleteSystem: (systemId: string) => void;
  addFMEARow: (systemId: string, row: FMEARow) => void;
  updateFMEARow: (systemId: string, rowId: string, updates: Partial<FMEARow>) => void;
  deleteFMEARow: (systemId: string, rowId: string) => void;
  addRiskEntry: (systemId: string, entry: RiskEntry) => void;
  updateRiskEntry: (systemId: string, entryId: string, updates: Partial<RiskEntry>) => void;
  deleteRiskEntry: (systemId: string, entryId: string) => void;
  addSafetyFunction: (systemId: string, sf: SafetyFunction) => void;
  updateSafetyFunction: (systemId: string, sfId: string, updates: Partial<SafetyFunction>) => void;
  deleteSafetyFunction: (systemId: string, sfId: string) => void;
  addSafetyMeasure: (systemId: string, measure: string) => void;
  updateSafetyMeasure: (systemId: string, index: number, value: string) => void;
  deleteSafetyMeasure: (systemId: string, index: number) => void;
  addConsequence: (systemId: string, consequence: string) => void;
  updateConsequence: (systemId: string, index: number, value: string) => void;
  deleteConsequence: (systemId: string, index: number) => void;
  updateFaultTreeNode: (systemId: string, nodeId: string, updates: Partial<FaultTreeNode>) => void;
  addFaultTreeChild: (systemId: string, parentId: string, child: FaultTreeNode) => void;
  deleteFaultTreeNode: (systemId: string, nodeId: string) => void;
  importData: (systems: SystemData[], meta: AnalysisMetadata) => void;
  clearAudit: () => void;
  resetToDefaults: () => void;
}

const SystemsContext = createContext<SystemsContextType | null>(null);

const STORAGE_KEY = "tsp-safety-systems-data";
const METADATA_KEY = "tsp-safety-metadata";

function loadFromStorage(): SystemData[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SystemData[];
  } catch { /* ignore */ }
  return null;
}

function loadMetadata(): AnalysisMetadata {
  try {
    const raw = localStorage.getItem(METADATA_KEY);
    if (raw) return JSON.parse(raw) as AnalysisMetadata;
  } catch { /* ignore */ }
  return {
    engineerName: "",
    date: new Date().toISOString().split("T")[0],
    lastModified: new Date().toISOString(),
    notes: "",
  };
}

function updateNodeInTree(node: FaultTreeNode, nodeId: string, updates: Partial<FaultTreeNode>): FaultTreeNode {
  if (node.id === nodeId) return { ...node, ...updates };
  if (!node.children) return node;
  return { ...node, children: node.children.map(c => updateNodeInTree(c, nodeId, updates)) };
}

function addChildToTree(node: FaultTreeNode, parentId: string, child: FaultTreeNode): FaultTreeNode {
  if (node.id === parentId) return { ...node, children: [...(node.children || []), child] };
  if (!node.children) return node;
  return { ...node, children: node.children.map(c => addChildToTree(c, parentId, child)) };
}

function deleteNodeFromTree(node: FaultTreeNode, nodeId: string): FaultTreeNode | null {
  if (node.id === nodeId) return null;
  if (!node.children) return node;
  const filtered = node.children.map(c => deleteNodeFromTree(c, nodeId)).filter(Boolean) as FaultTreeNode[];
  return { ...node, children: filtered };
}

export function SystemsProvider({ children }: { children: React.ReactNode }) {
  const [systems, setSystems] = useState<SystemData[]>(() => loadFromStorage() ?? structuredClone(initialSystems));
  const [metadata, setMetadata] = useState<AnalysisMetadata>(loadMetadata);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>(loadAuditTrail);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(systems));
    setMetadata(prev => {
      const updated = { ...prev, lastModified: new Date().toISOString() };
      localStorage.setItem(METADATA_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [systems]);

  const addAudit = useCallback((action: AuditAction, systemId: string, systemName: string, details: string) => {
    setAuditTrail(prev => {
      const entry = createAuditEntry(metadata.engineerName, action, systemId, systemName, details);
      const updated = [...prev, entry];
      saveAuditTrail(updated);
      return updated;
    });
  }, [metadata.engineerName]);

  const getSystemName = useCallback((id: string): string => {
    return systems.find(s => s.id === id)?.name ?? id;
  }, [systems]);

  const updateMetadata = useCallback((updates: Partial<AnalysisMetadata>) => {
    setMetadata(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(METADATA_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateSystemData = useCallback((systemId: string, updater: (s: SystemData) => SystemData) => {
    setSystems(prev => prev.map(s => s.id === systemId ? updater(s) : s));
  }, []);

  const updateSystem = useCallback((systemId: string, updates: Partial<SystemData>) => {
    updateSystemData(systemId, s => ({ ...s, ...updates }));
    addAudit("SYSTEM_UPDATE", systemId, getSystemName(systemId), `Updated: ${Object.keys(updates).join(", ")}`);
  }, [updateSystemData, addAudit, getSystemName]);

  const addSystem = useCallback((system: SystemData) => {
    setSystems(prev => [...prev, system]);
    addAudit("SYSTEM_ADD", system.id, system.name, `Added system "${system.name}"`);
  }, [addAudit]);

  const deleteSystem = useCallback((systemId: string) => {
    const name = getSystemName(systemId);
    setSystems(prev => prev.filter(s => s.id !== systemId));
    addAudit("SYSTEM_DELETE", systemId, name, `Deleted system "${name}"`);
  }, [addAudit, getSystemName]);

  const addFMEARow = useCallback((systemId: string, row: FMEARow) => {
    updateSystemData(systemId, s => ({ ...s, fmea: [...s.fmea, row] }));
    addAudit("FMEA_ADD", systemId, getSystemName(systemId), `Added: ${row.component}`);
  }, [updateSystemData, addAudit, getSystemName]);

  const updateFMEARow = useCallback((systemId: string, rowId: string, updates: Partial<FMEARow>) => {
    updateSystemData(systemId, s => ({
      ...s,
      fmea: s.fmea.map(r => r.id === rowId ? { ...r, ...updates } : r),
    }));
    addAudit("FMEA_UPDATE", systemId, getSystemName(systemId), `Updated row: ${Object.keys(updates).join(", ")}`);
  }, [updateSystemData, addAudit, getSystemName]);

  const deleteFMEARow = useCallback((systemId: string, rowId: string) => {
    updateSystemData(systemId, s => ({ ...s, fmea: s.fmea.filter(r => r.id !== rowId) }));
    addAudit("FMEA_DELETE", systemId, getSystemName(systemId), `Deleted FMEA row ${rowId}`);
  }, [updateSystemData, addAudit, getSystemName]);

  const addRiskEntry = useCallback((systemId: string, entry: RiskEntry) => {
    updateSystemData(systemId, s => ({ ...s, risks: [...s.risks, entry] }));
    addAudit("RISK_ADD", systemId, getSystemName(systemId), `Added: ${entry.hazard}`);
  }, [updateSystemData, addAudit, getSystemName]);

  const updateRiskEntry = useCallback((systemId: string, entryId: string, updates: Partial<RiskEntry>) => {
    updateSystemData(systemId, s => ({
      ...s,
      risks: s.risks.map(r => r.id === entryId ? { ...r, ...updates } : r),
    }));
    addAudit("RISK_UPDATE", systemId, getSystemName(systemId), `Updated risk entry`);
  }, [updateSystemData, addAudit, getSystemName]);

  const deleteRiskEntry = useCallback((systemId: string, entryId: string) => {
    updateSystemData(systemId, s => ({ ...s, risks: s.risks.filter(r => r.id !== entryId) }));
    addAudit("RISK_DELETE", systemId, getSystemName(systemId), `Deleted risk entry`);
  }, [updateSystemData, addAudit, getSystemName]);

  const addSafetyFunction = useCallback((systemId: string, sf: SafetyFunction) => {
    updateSystemData(systemId, s => ({ ...s, safetyFunctions: [...s.safetyFunctions, sf] }));
    addAudit("SAFETY_FN_ADD", systemId, getSystemName(systemId), `Added: ${sf.function}`);
  }, [updateSystemData, addAudit, getSystemName]);

  const updateSafetyFunction = useCallback((systemId: string, sfId: string, updates: Partial<SafetyFunction>) => {
    updateSystemData(systemId, s => ({
      ...s,
      safetyFunctions: s.safetyFunctions.map(f => f.id === sfId ? { ...f, ...updates } : f),
    }));
    addAudit("SAFETY_FN_UPDATE", systemId, getSystemName(systemId), `Updated safety function`);
  }, [updateSystemData, addAudit, getSystemName]);

  const deleteSafetyFunction = useCallback((systemId: string, sfId: string) => {
    updateSystemData(systemId, s => ({ ...s, safetyFunctions: s.safetyFunctions.filter(f => f.id !== sfId) }));
    addAudit("SAFETY_FN_DELETE", systemId, getSystemName(systemId), `Deleted safety function`);
  }, [updateSystemData, addAudit, getSystemName]);

  const addSafetyMeasure = useCallback((systemId: string, measure: string) => {
    updateSystemData(systemId, s => ({ ...s, safetyMeasures: [...s.safetyMeasures, measure] }));
    addAudit("SAFETY_MEASURE_ADD", systemId, getSystemName(systemId), `Added measure`);
  }, [updateSystemData, addAudit, getSystemName]);

  const updateSafetyMeasure = useCallback((systemId: string, index: number, value: string) => {
    updateSystemData(systemId, s => {
      const m = [...s.safetyMeasures];
      m[index] = value;
      return { ...s, safetyMeasures: m };
    });
  }, [updateSystemData]);

  const deleteSafetyMeasure = useCallback((systemId: string, index: number) => {
    updateSystemData(systemId, s => ({ ...s, safetyMeasures: s.safetyMeasures.filter((_, i) => i !== index) }));
    addAudit("SAFETY_MEASURE_DELETE", systemId, getSystemName(systemId), `Deleted safety measure`);
  }, [updateSystemData, addAudit, getSystemName]);

  const addConsequence = useCallback((systemId: string, consequence: string) => {
    updateSystemData(systemId, s => ({ ...s, consequences: [...s.consequences, consequence] }));
    addAudit("CONSEQUENCE_ADD", systemId, getSystemName(systemId), `Added consequence`);
  }, [updateSystemData, addAudit, getSystemName]);

  const updateConsequence = useCallback((systemId: string, index: number, value: string) => {
    updateSystemData(systemId, s => {
      const c = [...s.consequences];
      c[index] = value;
      return { ...s, consequences: c };
    });
  }, [updateSystemData]);

  const deleteConsequence = useCallback((systemId: string, index: number) => {
    updateSystemData(systemId, s => ({ ...s, consequences: s.consequences.filter((_, i) => i !== index) }));
    addAudit("CONSEQUENCE_DELETE", systemId, getSystemName(systemId), `Deleted consequence`);
  }, [updateSystemData, addAudit, getSystemName]);

  const updateFaultTreeNode = useCallback((systemId: string, nodeId: string, updates: Partial<FaultTreeNode>) => {
    updateSystemData(systemId, s => ({ ...s, faultTree: updateNodeInTree(s.faultTree, nodeId, updates) }));
    addAudit("FAULT_TREE_UPDATE", systemId, getSystemName(systemId), `Updated node ${nodeId}`);
  }, [updateSystemData, addAudit, getSystemName]);

  const addFaultTreeChild = useCallback((systemId: string, parentId: string, child: FaultTreeNode) => {
    updateSystemData(systemId, s => ({ ...s, faultTree: addChildToTree(s.faultTree, parentId, child) }));
    addAudit("FAULT_TREE_ADD", systemId, getSystemName(systemId), `Added child to ${parentId}`);
  }, [updateSystemData, addAudit, getSystemName]);

  const deleteFaultTreeNode = useCallback((systemId: string, nodeId: string) => {
    updateSystemData(systemId, s => {
      const result = deleteNodeFromTree(s.faultTree, nodeId);
      return result ? { ...s, faultTree: result } : s;
    });
    addAudit("FAULT_TREE_DELETE", systemId, getSystemName(systemId), `Deleted node ${nodeId}`);
  }, [updateSystemData, addAudit, getSystemName]);

  const importData = useCallback((newSystems: SystemData[], newMeta: AnalysisMetadata) => {
    setSystems(newSystems);
    setMetadata(newMeta);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSystems));
    localStorage.setItem(METADATA_KEY, JSON.stringify(newMeta));
    addAudit("DATA_IMPORT", "global", "All Systems", `Imported ${newSystems.length} systems`);
  }, [addAudit]);

  const clearAudit = useCallback(() => {
    clearAuditTrail();
    setAuditTrail([]);
  }, []);

  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(METADATA_KEY);
    setSystems(structuredClone(initialSystems));
    const freshMeta: AnalysisMetadata = {
      engineerName: metadata.engineerName,
      date: new Date().toISOString().split("T")[0],
      lastModified: new Date().toISOString(),
      notes: "",
    };
    setMetadata(freshMeta);
    addAudit("DATA_RESET", "global", "All Systems", "Reset all data to defaults");
  }, [addAudit, metadata.engineerName]);

  return (
    <SystemsContext.Provider value={{
      systems, metadata, auditTrail, updateMetadata, updateSystem, addSystem, deleteSystem,
      addFMEARow, updateFMEARow, deleteFMEARow,
      addRiskEntry, updateRiskEntry, deleteRiskEntry,
      addSafetyFunction, updateSafetyFunction, deleteSafetyFunction,
      addSafetyMeasure, updateSafetyMeasure, deleteSafetyMeasure,
      addConsequence, updateConsequence, deleteConsequence,
      updateFaultTreeNode, addFaultTreeChild, deleteFaultTreeNode,
      importData, clearAudit, resetToDefaults,
    }}>
      {children}
    </SystemsContext.Provider>
  );
}

export function useSystems() {
  const ctx = useContext(SystemsContext);
  if (!ctx) throw new Error("useSystems must be used within SystemsProvider");
  return ctx;
}
