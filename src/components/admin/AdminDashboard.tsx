import { LeadershipConsole } from "@/components/admin/LeadershipConsole";
import { useAuth } from "@/hooks/useAuth";

export function AdminDashboard() {
  const { auth } = useAuth();
  const mode =
    auth?.staffRoleKey === "VICE_PRINCIPAL" ? "vice_principal" : "principal";

  return <LeadershipConsole mode={mode} />;
}
