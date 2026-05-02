import type { ReactNode } from "react";
import { Navigate } from "react-router";
import type { UserRole } from "../../../shared/types/api";
import { authStore } from "../../../shared/lib/auth";

type RequireRoleProps = {
  roles: UserRole[];
  redirectTo: string;
  children: ReactNode;
};

export function RequireRole({ roles, redirectTo, children }: RequireRoleProps) {
  const session = authStore.getSession();
  const ok =
    Boolean(session?.user) &&
    Boolean(session.user.role) &&
    roles.includes(session.user.role);

  if (!ok) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
