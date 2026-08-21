import { requireSupabase } from "@/services/supabase";
import type { AuditAction, AuditLog } from "@/types/audit";

export type AuditLogFilters = {
  tableName?: string;
  action?: AuditAction;
  limit?: number;
};

export async function fetchAuditLogs(filters?: AuditLogFilters): Promise<AuditLog[]> {
  const client = requireSupabase();
  let query = client
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 100);

  if (filters?.tableName) {
    query = query.eq("table_name", filters.tableName);
  }

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || "Failed to load audit logs.");
  }

  return data ?? [];
}
