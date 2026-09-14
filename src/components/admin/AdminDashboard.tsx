import { LeadershipConsole } from "@/components/admin/LeadershipConsole";
import { PrincipalCommandCentre } from "@/components/admin/PrincipalCommandCentre";
import { useAuth } from "@/hooks/useAuth";

export function AdminDashboard() {
  const { auth } = useAuth();
  const mode =
    auth?.staffRoleKey === "VICE_PRINCIPAL" ? "vice_principal" : "principal";

  return (
    <>
      <PrincipalCommandCentre />
      <LeadershipConsole mode={mode} />
    </>
  );
}
