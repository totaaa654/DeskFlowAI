export type UserRole = "employee" | "technician" | "it_admin" | "super_admin";

export type AccountStatus = "pending" | "invited" | "active" | "suspended";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: AccountStatus;
  department: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
}

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export interface UserInvitation {
  id: string;
  auth_user_id: string | null;
  email: string;
  full_name: string;
  intended_role: UserRole;
  department: string | null;
  status: InvitationStatus;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export const roleLabels: Record<UserRole, string> = {
  employee: "Employee",
  technician: "IT Technician",
  it_admin: "IT Admin",
  super_admin: "Super Admin",
};

export interface AuthActionResult {
  error: string | null;
}
