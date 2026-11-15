import { FunctionsHttpError } from "@supabase/supabase-js";
import { requireSupabase } from "@/lib/supabase";
import type { AccountStatus, Profile, UserInvitation, UserRole } from "@/types/auth";

export interface InviteUserInput {
  email: string;
  fullName: string;
  role: UserRole;
  department?: string;
}

export class AdminActionError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
    this.name = "AdminActionError";
  }
}

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await requireSupabase().from("profiles")
    .select("id,email,full_name,role,status,department,created_at,updated_at,last_sign_in_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function listInvitations(): Promise<UserInvitation[]> {
  const { data, error } = await requireSupabase().from("user_invitations")
    .select("id,auth_user_id,email,full_name,intended_role,department,status,invited_by,expires_at,accepted_at,revoked_at,created_at,updated_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserInvitation[];
}

async function invokeAdmin(body: Record<string, unknown>): Promise<void> {
  const client = requireSupabase();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session?.access_token) throw new Error("Your session has expired. Sign in again.");
  const { error } = await client.functions.invoke("admin-users", {
    body,
    headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
  });
  if (!error) return;
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    const payload = (await error.context.clone().json().catch(() => null)) as {
      error?: string;
      code?: string;
    } | null;
    if (payload?.error) throw new AdminActionError(payload.error, payload.code);
  }
  throw error;
}

export async function inviteUser(input: InviteUserInput): Promise<void> {
  await invokeAdmin({ action: "invite", ...input });
}

export async function verifyAdminAccess(): Promise<void> {
  await invokeAdmin({ action: "access-check" });
}

export async function updateUserAccount(
  userId: string,
  changes: { role?: UserRole; status?: Extract<AccountStatus, "active" | "suspended"> },
): Promise<void> {
  await invokeAdmin({ action: "update", userId, ...changes });
}

export async function resendInvitation(invitationId: string): Promise<void> {
  await invokeAdmin({ action: "resend", invitationId });
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  await invokeAdmin({ action: "revoke", invitationId });
}
