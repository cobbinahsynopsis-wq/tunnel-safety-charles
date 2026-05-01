import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { systems as initialSystems, type SystemData, type FMEARow, type RiskEntry, type SafetyFunction, type FaultTreeNode, type RiskLevel, type SignOffRecord } from "@/data/systems";
import { type AuditEntry, type AuditAction, loadAuditTrail, saveAuditTrail, createAuditEntry, clearAuditTrail } from "@/utils/auditTrail";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchAllSystems,
  fetchMetadata,
  seedSystems,
  upsertSystem,
  deleteSystemRow,
  upsertMetadata,
  createRevision,
} from "@/utils/cloudSync";

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
  cloudReady: boolean;
  updateMetadata: (updates: Partial<AnalysisMetadata>) => void;
  updateSystem: (systemId: string, updates: Partial<SystemData>) => void;
  addSystem: (system: SystemData) => void;
  deleteSystem: (systemId: string) => void;
  signOffSystem: (systemId: string, engineer: string, comments: string) => void;
  unlockSystem: (systemId: string, engineer: string) => void;
  isSystemLocked: (systemId: string) => boolean;
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
  const [cloudReady, setCloudReady] = useState(false);
  // Refs to avoid echoing realtime updates back to the DB
  const skipNextSyncRef = React.useRef<Set<string>>(new Set());
  const pendingTimersRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const systemsRef = React.useRef(systems);
  const engineerRef = React.useRef(metadata.engineerName);
  React.useEffect(() => { systemsRef.current = systems; }, [systems]);
  React.useEffect(() => { engineerRef.current = metadata.engineerName; }, [metadata.engineerName]);

  // Initial load from cloud + realtime subscription
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const cloud = await fetchAllSystems();
      if (cancelled) return;
      if (cloud && cloud.length > 0) {
        setSystems(cloud);
      } else {
        // Empty DB — seed with whatever we currently have (initial defaults or local)
        const seedFrom = loadFromStorage() ?? structuredClone(initialSystems);
        await seedSystems(seedFrom, metadata.engineerName);
        setSystems(seedFrom);
      }
      const meta = await fetchMetadata();
      if (!cancelled && meta) {
        setMetadata(prev => ({ ...prev, ...meta }));
      }
      if (!cancelled) setCloudReady(true);
    })();

    const channel = supabase
      .channel("systems-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "systems" }, payload => {
        if (payload.eventType === "DELETE") {
          const oldId = (payload.old as { id?: string })?.id;
          if (!oldId) return;
          setSystems(prev => prev.filter(s => s.id !== oldId));
          return;
        }
        const row = payload.new as { id: string; data: SystemData };
        if (!row?.id) return;
        // Suppress echo of our own write
        if (skipNextSyncRef.current.has(row.id)) {
          skipNextSyncRef.current.delete(row.id);
          return;
        }
        setSystems(prev => {
          const idx = prev.findIndex(s => s.id === row.id);
          if (idx === -1) return [...prev, row.data];
          const copy = [...prev];
          copy[idx] = row.data;
          return copy;
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "app_metadata" }, payload => {
        const row = payload.new as { id: string; data: AnalysisMetadata };
        if (row?.id !== "global") return;
        setMetadata(prev => ({ ...prev, ...row.data, lastModified: row.data.lastModified ?? prev.lastModified }));
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced push of a single system to the cloud
  const schedulePush = useCallback((systemId: string) => {
    const timers = pendingTimersRef.current;
    const existing = timers.get(systemId);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      timers.delete(systemId);
      const sys = systemsRef.current.find(s => s.id === systemId);
      if (!sys) return;
      skipNextSyncRef.current.add(systemId);
      upsertSystem(sys, engineerRef.current);
    }, 400);
    timers.set(systemId, t);
  }, []);

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
      upsertMetadata(updated);
      return updated;
    });
  }, []);

  const updateSystemData = useCallback((systemId: string, updater: (s: SystemData) => SystemData) => {
    setSystems(prev => prev.map(s => s.id === systemId ? updater(s) : s));
    schedulePush(systemId);
  }, [schedulePush]);

  const updateSystem = useCallback((systemId: string, updates: Partial<SystemData>) => {
    updateSystemData(systemId, s => ({ ...s, ...updates }));
    addAudit("SYSTEM_UPDATE", systemId, getSystemName(systemId), `Updated: ${Object.keys(updates).join(", ")}`);
  }, [updateSystemData, addAudit, getSystemName]);

  const addSystem = useCallback((system: SystemData) => {
    setSystems(prev => [...prev, system]);
    skipNextSyncRef.current.add(system.id);
    upsertSystem(system, engineerRef.current);
    addAudit("SYSTEM_ADD", system.id, system.name, `Added system "${system.name}"`);
  }, [addAudit]);

  const deleteSystem = useCallback((systemId: string) => {
    const name = getSystemName(systemId);
    setSystems(prev => prev.filter(s => s.id !== systemId));
    deleteSystemRow(systemId);
    addAudit("SYSTEM_DELETE", systemId, name, `Deleted system "${name}"`);
  }, [addAudit, getSystemName]);

  const signOffSystem = useCallback((systemId: string, engineer: string, comments: string) => {
    const signOff: SignOffRecord = {
      signedOff: true,
      signedOffBy: engineer,
      signedOffAt: new Date().toISOString(),
      comments,
    };
    // Apply lock to local state + push immediately, then snapshot revision
    setSystems(prev => {
      const next = prev.map(s => s.id === systemId ? { ...s, signOff } : s);
      const updated = next.find(s => s.id === systemId);
      if (updated) {
        skipNextSyncRef.current.add(systemId);
        upsertSystem(updated, engineer).then(() => {
          createRevision(updated, engineer, comments, "signoff");
        });
      }
      return next;
    });
    addAudit("SYSTEM_SIGNOFF", systemId, getSystemName(systemId), `Signed off by ${engineer}`);
  }, [addAudit, getSystemName]);

  const unlockSystem = useCallback((systemId: string, engineer: string) => {
    updateSystemData(systemId, s => ({ ...s, signOff: undefined }));
    addAudit("SYSTEM_UNLOCK", systemId, getSystemName(systemId), `Unlocked by ${engineer}`);
  }, [updateSystemData, addAudit, getSystemName]);

  const isSystemLocked = useCallback((systemId: string) => {
    return systems.find(s => s.id === systemId)?.signOff?.signedOff === true;
  }, [systems]);

  const addFMEARow = useCallback((systemId: string, row: FMEARow) => {
    const stamped = { ...row, lastModifiedBy: metadata.engineerName, lastModifiedAt: new Date().toISOString() };
    updateSystemData(systemId, s => ({ ...s, fmea: [...s.fmea, stamped] }));
    addAudit("FMEA_ADD", systemId, getSystemName(systemId), `Added: ${row.component}`);
  }, [updateSystemData, addAudit, getSystemName, metadata.engineerName]);

  const updateFMEARow = useCallback((systemId: string, rowId: string, updates: Partial<FMEARow>) => {
    const stamped = { ...updates, lastModifiedBy: metadata.engineerName, lastModifiedAt: new Date().toISOString() };
    updateSystemData(systemId, s => ({
      ...s,
      fmea: s.fmea.map(r => r.id === rowId ? { ...r, ...stamped } : r),
    }));
    addAudit("FMEA_UPDATE", systemId, getSystemName(systemId), `Updated row: ${Object.keys(updates).join(", ")}`);
  }, [updateSystemData, addAudit, getSystemName, metadata.engineerName]);

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
    seedSystems(newSystems, newMeta.engineerName);
    upsertMetadata(newMeta);
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
    seedSystems(structuredClone(initialSystems), metadata.engineerName);
    const freshMeta: AnalysisMetadata = {
      engineerName: metadata.engineerName,
      date: new Date().toISOString().split("T")[0],
      lastModified: new Date().toISOString(),
      notes: "",
    };
    setMetadata(freshMeta);
    upsertMetadata(freshMeta);
    addAudit("DATA_RESET", "global", "All Systems", "Reset all data to defaults");
  }, [addAudit, metadata.engineerName]);

  return (
    <SystemsContext.Provider value={{
      systems, metadata, auditTrail, cloudReady, updateMetadata, updateSystem, addSystem, deleteSystem,
      signOffSystem, unlockSystem, isSystemLocked,
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
