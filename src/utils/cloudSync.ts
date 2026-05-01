import { supabase } from "@/integrations/supabase/client";
import type { SystemData } from "@/data/systems";

export interface AnalysisMetadataPayload {
  engineerName: string;
  date: string;
  lastModified: string;
  notes: string;
}

export interface RevisionRecord {
  id: string;
  system_id: string;
  revision_number: number;
  revision_label: string;
  snapshot: SystemData;
  created_by: string | null;
  comments: string | null;
  trigger: string;
  created_at: string;
}

/** Fetch all systems from the database. Returns null if the table is empty. */
export async function fetchAllSystems(): Promise<SystemData[] | null> {
  const { data, error } = await supabase.from("systems").select("data").order("created_at", { ascending: true });
  if (error) {
    console.error("[cloudSync] fetchAllSystems error", error);
    return null;
  }
  if (!data || data.length === 0) return null;
  return data.map(r => r.data as unknown as SystemData);
}

/** Bulk-seed initial systems (only used the very first time the app runs against an empty DB). */
export async function seedSystems(systems: SystemData[], engineer: string): Promise<void> {
  const rows = systems.map(s => ({ id: s.id, data: s as unknown as Record<string, unknown>, updated_by: engineer }));
  const { error } = await supabase.from("systems").upsert(rows, { onConflict: "id" });
  if (error) console.error("[cloudSync] seedSystems error", error);
}

/** Push a single system (full record) to the database. */
export async function upsertSystem(system: SystemData, engineer: string): Promise<void> {
  const { error } = await supabase
    .from("systems")
    .upsert(
      { id: system.id, data: system as unknown as Record<string, unknown>, updated_by: engineer, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
  if (error) console.error("[cloudSync] upsertSystem error", error);
}

export async function deleteSystemRow(systemId: string): Promise<void> {
  const { error } = await supabase.from("systems").delete().eq("id", systemId);
  if (error) console.error("[cloudSync] deleteSystem error", error);
}

/* ---------- Metadata ---------- */

export async function fetchMetadata(): Promise<AnalysisMetadataPayload | null> {
  const { data, error } = await supabase.from("app_metadata").select("data").eq("id", "global").maybeSingle();
  if (error) {
    console.error("[cloudSync] fetchMetadata error", error);
    return null;
  }
  return (data?.data as unknown as AnalysisMetadataPayload) ?? null;
}

export async function upsertMetadata(meta: AnalysisMetadataPayload): Promise<void> {
  const { error } = await supabase
    .from("app_metadata")
    .upsert({ id: "global", data: meta as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) console.error("[cloudSync] upsertMetadata error", error);
}

/* ---------- Revisions ---------- */

export async function fetchRevisions(systemId: string): Promise<RevisionRecord[]> {
  const { data, error } = await supabase
    .from("system_revisions")
    .select("*")
    .eq("system_id", systemId)
    .order("revision_number", { ascending: false });
  if (error) {
    console.error("[cloudSync] fetchRevisions error", error);
    return [];
  }
  return (data ?? []) as unknown as RevisionRecord[];
}

export async function getNextRevisionNumber(systemId: string): Promise<number> {
  const { data, error } = await supabase
    .from("system_revisions")
    .select("revision_number")
    .eq("system_id", systemId)
    .order("revision_number", { ascending: false })
    .limit(1);
  if (error) {
    console.error("[cloudSync] getNextRevisionNumber error", error);
    return 1;
  }
  const last = data?.[0]?.revision_number ?? 0;
  return last + 1;
}

export async function createRevision(
  system: SystemData,
  engineer: string,
  comments: string,
  trigger: "signoff" | "manual" = "signoff"
): Promise<RevisionRecord | null> {
  const next = await getNextRevisionNumber(system.id);
  const label = `REV.${String(next).padStart(2, "0")}`;
  const { data, error } = await supabase
    .from("system_revisions")
    .insert({
      system_id: system.id,
      revision_number: next,
      revision_label: label,
      snapshot: system as unknown as Record<string, unknown>,
      created_by: engineer || null,
      comments: comments || null,
      trigger,
    })
    .select()
    .single();
  if (error) {
    console.error("[cloudSync] createRevision error", error);
    return null;
  }
  return data as unknown as RevisionRecord;
}