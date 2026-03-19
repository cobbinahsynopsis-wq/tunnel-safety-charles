import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { systems as initialSystems, type SystemData, type FMEARow, type RiskEntry, type SafetyFunction, type FaultTreeNode, type RiskLevel } from "@/data/systems";

export interface AnalysisMetadata {
  engineerName: string;
  date: string;
  lastModified: string;
  notes: string;
}

interface SystemsContextType {
  systems: SystemData[];
  metadata: AnalysisMetadata;
  updateMetadata: (updates: Partial<AnalysisMetadata>) => void;
  updateSystem: (systemId: string, updates: Partial<SystemData>) => void;
  addSystem: (system: SystemData) => void;
  deleteSystem: (systemId: string) => void;
  // FMEA
  addFMEARow: (systemId: string, row: FMEARow) => void;
  updateFMEARow: (systemId: string, rowId: string, updates: Partial<FMEARow>) => void;
  deleteFMEARow: (systemId: string, rowId: string) => void;
  // Risk entries
  addRiskEntry: (systemId: string, entry: RiskEntry) => void;
  updateRiskEntry: (systemId: string, entryId: string, updates: Partial<RiskEntry>) => void;
  deleteRiskEntry: (systemId: string, entryId: string) => void;
  // Safety functions
  addSafetyFunction: (systemId: string, sf: SafetyFunction) => void;
  updateSafetyFunction: (systemId: string, sfId: string, updates: Partial<SafetyFunction>) => void;
  deleteSafetyFunction: (systemId: string, sfId: string) => void;
  // Safety measures & consequences
  addSafetyMeasure: (systemId: string, measure: string) => void;
  updateSafetyMeasure: (systemId: string, index: number, value: string) => void;
  deleteSafetyMeasure: (systemId: string, index: number) => void;
  addConsequence: (systemId: string, consequence: string) => void;
  updateConsequence: (systemId: string, index: number, value: string) => void;
  deleteConsequence: (systemId: string, index: number) => void;
  // Fault tree
  updateFaultTreeNode: (systemId: string, nodeId: string, updates: Partial<FaultTreeNode>) => void;
  addFaultTreeChild: (systemId: string, parentId: string, child: FaultTreeNode) => void;
  deleteFaultTreeNode: (systemId: string, nodeId: string) => void;
  // Reset
  resetToDefaults: () => void;
}

const SystemsContext = createContext<SystemsContextType | null>(null);

const STORAGE_KEY = "tsp-safety-systems-data";
const METADATA_KEY = "tsp-safety-metadata";

function loadFromStorage(): SystemData[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SystemData[];
  } catch { /* ignore parse errors */ }
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

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(systems));
    setMetadata(prev => {
      const updated = { ...prev, lastModified: new Date().toISOString() };
      localStorage.setItem(METADATA_KEY, JSON.stringify(updated));
      return updated;
    });
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
  }, [updateSystemData]);

  const addSystem = useCallback((system: SystemData) => {
    setSystems(prev => [...prev, system]);
  }, []);

  const deleteSystem = useCallback((systemId: string) => {
    setSystems(prev => prev.filter(s => s.id !== systemId));
  }, []);

  const addFMEARow = useCallback((systemId: string, row: FMEARow) => {
    updateSystemData(systemId, s => ({ ...s, fmea: [...s.fmea, row] }));
  }, [updateSystemData]);

  const updateFMEARow = useCallback((systemId: string, rowId: string, updates: Partial<FMEARow>) => {
    updateSystemData(systemId, s => ({
      ...s,
      fmea: s.fmea.map(r => r.id === rowId ? { ...r, ...updates } : r),
    }));
  }, [updateSystemData]);

  const deleteFMEARow = useCallback((systemId: string, rowId: string) => {
    updateSystemData(systemId, s => ({ ...s, fmea: s.fmea.filter(r => r.id !== rowId) }));
  }, [updateSystemData]);

  const addRiskEntry = useCallback((systemId: string, entry: RiskEntry) => {
    updateSystemData(systemId, s => ({ ...s, risks: [...s.risks, entry] }));
  }, [updateSystemData]);

  const updateRiskEntry = useCallback((systemId: string, entryId: string, updates: Partial<RiskEntry>) => {
    updateSystemData(systemId, s => ({
      ...s,
      risks: s.risks.map(r => r.id === entryId ? { ...r, ...updates } : r),
    }));
  }, [updateSystemData]);

  const deleteRiskEntry = useCallback((systemId: string, entryId: string) => {
    updateSystemData(systemId, s => ({ ...s, risks: s.risks.filter(r => r.id !== entryId) }));
  }, [updateSystemData]);

  const addSafetyFunction = useCallback((systemId: string, sf: SafetyFunction) => {
    updateSystemData(systemId, s => ({ ...s, safetyFunctions: [...s.safetyFunctions, sf] }));
  }, [updateSystemData]);

  const updateSafetyFunction = useCallback((systemId: string, sfId: string, updates: Partial<SafetyFunction>) => {
    updateSystemData(systemId, s => ({
      ...s,
      safetyFunctions: s.safetyFunctions.map(f => f.id === sfId ? { ...f, ...updates } : f),
    }));
  }, [updateSystemData]);

  const deleteSafetyFunction = useCallback((systemId: string, sfId: string) => {
    updateSystemData(systemId, s => ({ ...s, safetyFunctions: s.safetyFunctions.filter(f => f.id !== sfId) }));
  }, [updateSystemData]);

  const addSafetyMeasure = useCallback((systemId: string, measure: string) => {
    updateSystemData(systemId, s => ({ ...s, safetyMeasures: [...s.safetyMeasures, measure] }));
  }, [updateSystemData]);

  const updateSafetyMeasure = useCallback((systemId: string, index: number, value: string) => {
    updateSystemData(systemId, s => {
      const m = [...s.safetyMeasures];
      m[index] = value;
      return { ...s, safetyMeasures: m };
    });
  }, [updateSystemData]);

  const deleteSafetyMeasure = useCallback((systemId: string, index: number) => {
    updateSystemData(systemId, s => ({ ...s, safetyMeasures: s.safetyMeasures.filter((_, i) => i !== index) }));
  }, [updateSystemData]);

  const addConsequence = useCallback((systemId: string, consequence: string) => {
    updateSystemData(systemId, s => ({ ...s, consequences: [...s.consequences, consequence] }));
  }, [updateSystemData]);

  const updateConsequence = useCallback((systemId: string, index: number, value: string) => {
    updateSystemData(systemId, s => {
      const c = [...s.consequences];
      c[index] = value;
      return { ...s, consequences: c };
    });
  }, [updateSystemData]);

  const deleteConsequence = useCallback((systemId: string, index: number) => {
    updateSystemData(systemId, s => ({ ...s, consequences: s.consequences.filter((_, i) => i !== index) }));
  }, [updateSystemData]);

  const updateFaultTreeNode = useCallback((systemId: string, nodeId: string, updates: Partial<FaultTreeNode>) => {
    updateSystemData(systemId, s => ({ ...s, faultTree: updateNodeInTree(s.faultTree, nodeId, updates) }));
  }, [updateSystemData]);

  const addFaultTreeChild = useCallback((systemId: string, parentId: string, child: FaultTreeNode) => {
    updateSystemData(systemId, s => ({ ...s, faultTree: addChildToTree(s.faultTree, parentId, child) }));
  }, [updateSystemData]);

  const deleteFaultTreeNode = useCallback((systemId: string, nodeId: string) => {
    updateSystemData(systemId, s => {
      const result = deleteNodeFromTree(s.faultTree, nodeId);
      return result ? { ...s, faultTree: result } : s;
    });
  }, [updateSystemData]);

  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(METADATA_KEY);
    setSystems(structuredClone(initialSystems));
    setMetadata({
      engineerName: "",
      date: new Date().toISOString().split("T")[0],
      lastModified: new Date().toISOString(),
      notes: "",
    });
  }, []);

  return (
    <SystemsContext.Provider value={{
      systems, metadata, updateMetadata, updateSystem, addSystem, deleteSystem,
      addFMEARow, updateFMEARow, deleteFMEARow,
      addRiskEntry, updateRiskEntry, deleteRiskEntry,
      addSafetyFunction, updateSafetyFunction, deleteSafetyFunction,
      addSafetyMeasure, updateSafetyMeasure, deleteSafetyMeasure,
      addConsequence, updateConsequence, deleteConsequence,
      updateFaultTreeNode, addFaultTreeChild, deleteFaultTreeNode,
      resetToDefaults,
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
