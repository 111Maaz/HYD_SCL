export const AUDIT_ACTIONS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "IMPORT",
  "EXPORT",
  "APPROVE",
  "REJECT",
  "ASSIGN",
  "UNASSIGN",
  "OTHER",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditLog = {
  id: string;
  actor_user_id: string | null;
  actor_staff_id: string | null;
  action: AuditAction;
  table_name: string | null;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  INSERT: "Insert",
  UPDATE: "Update",
  DELETE: "Delete",
  LOGIN: "Login",
  LOGOUT: "Logout",
  IMPORT: "Import",
  EXPORT: "Export",
  APPROVE: "Approve",
  REJECT: "Reject",
  ASSIGN: "Assign",
  UNASSIGN: "Unassign",
  OTHER: "Other",
};
