import type { UserRole } from "@/types/auth";

const regularRoles = new Set<UserRole>(["employee", "technician"]);

export function isAdministrator(role: UserRole): boolean {
  return role === "it_admin" || role === "super_admin";
}

export function canAdminManageRole(callerRole: UserRole, targetRole: UserRole): boolean {
  return callerRole === "super_admin" || (callerRole === "it_admin" && regularRoles.has(targetRole));
}

export const canAdminInviteRole = canAdminManageRole;
