import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";
import { classifyInvitationFailure } from "./invitation-errors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const roles = new Set(["employee", "technician", "it_admin", "super_admin"]);
const statuses = new Set(["active", "suspended"]);
const regularRoles = new Set(["employee", "technician"]);
type Role = "employee" | "technician" | "it_admin" | "super_admin";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function canManageRole(callerRole: Role, targetRole: Role) {
  return callerRole === "super_admin" || regularRoles.has(targetRole);
}

function cleanDepartment(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim();
}

async function findAuthUserByEmail(
  adminClient: SupabaseClient,
  email: string,
): Promise<{ user: User | null; error: string | null }> {
  const perPage = 1000;
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) return { user: null, error: error.message };

    const user = data.users.find((candidate) => candidate.email?.trim().toLowerCase() === email);
    if (user) return { user, error: null };
    if (data.users.length < perPage) return { user: null, error: null };
  }

  return { user: null, error: "The Auth user directory lookup exceeded its safe page limit." };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  // Hosted Edge Functions always provide the legacy service-role JWT. Prefer
  // it because PostgREST can use it as a Bearer token to bypass RLS. New
  // sb_secret keys are valid API keys, but are not JWT Bearer credentials.
  const secretKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY");
  const authorization = request.headers.get("Authorization");
  if (!supabaseUrl || !anonKey || !secretKey) return json({ error: "Server configuration is incomplete." }, 500);
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required." }, 401);

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const token = authorization.slice("Bearer ".length);
  const { data: userData, error: userError } = await callerClient.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Authentication required." }, 401);

  // Authorize through the caller's own JWT and the self-read profile policy.
  // The service-role client is reserved for operations after this check.
  const { data: caller, error: callerError } = await callerClient.from("profiles")
    .select("id,role,status").eq("id", userData.user.id).single();
  if (callerError || !caller || !["it_admin", "super_admin"].includes(caller.role) || caller.status !== "active") {
    console.error("Administrator authorization rejected", {
      userId: userData.user.id,
      profileFound: Boolean(caller),
      role: caller?.role ?? null,
      status: caller?.status ?? null,
      profileError: callerError?.message ?? null,
    });
    return json({ error: "Active administrator access is required." }, 403);
  }
  const callerRole = caller.role as Role;

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return json({ error: "A valid JSON body is required." }, 400); }

  if (body.action === "access-check") {
    return json({ ok: true, role: callerRole });
  }

  await adminClient.from("user_invitations").update({ status: "expired" })
    .eq("status", "pending").lte("expires_at", new Date().toISOString());

  if (body.action === "invite") {
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const role = typeof body.role === "string" ? body.role as Role : "employee";
    const department = cleanDepartment(body.department);
    if (!/^\S+@\S+\.\S+$/.test(email) || !fullName || fullName.length > 160 || !roles.has(role) || (department?.length ?? 0) > 120) {
      return json({ error: "Email, full name, role, or department is invalid." }, 400);
    }
    if (!canManageRole(callerRole, role)) {
      return json({ error: "IT Admins can invite only Employees and IT Technicians." }, 403);
    }
    const { count: openInvites } = await adminClient.from("user_invitations")
      .select("id", { count: "exact", head: true }).ilike("email", email).eq("status", "pending");
    if ((openInvites ?? 0) > 0) return json({ error: "A pending invitation already exists for this email." }, 409);

    // Reconcile an Auth identity left behind by a manually deleted profile or
    // an accepted invitation that never reached password setup. Active and
    // suspended accounts are never replaced through the invitation form.
    const authLookup = await findAuthUserByEmail(adminClient, email);
    if (authLookup.error) {
      console.error("Auth identity lookup failed", { email, error: authLookup.error });
      return json({ error: "The existing Auth account could not be checked. Try again." }, 500);
    }
    const existingAuthUser = authLookup.user;
    let replacedAuthUserId: string | null = null;
    if (existingAuthUser) {
      if (existingAuthUser.id === userData.user.id) {
        return json({ error: "You cannot replace your own administrator account with an invitation." }, 409);
      }

      const { data: existingProfile, error: existingProfileError } = await adminClient.from("profiles")
        .select("role,status").eq("id", existingAuthUser.id).maybeSingle();
      if (existingProfileError) {
        console.error("Existing Auth profile lookup failed", {
          authUserId: existingAuthUser.id,
          error: existingProfileError.message,
        });
        return json({ error: "The existing account profile could not be checked. Try again." }, 500);
      }
      if (existingProfile && !canManageRole(callerRole, existingProfile.role as Role)) {
        return json({ error: "Only a Super Admin can replace this unactivated administrator account." }, 403);
      }
      if (existingProfile && ["active", "suspended"].includes(existingProfile.status)) {
        return json({ error: "An active or suspended account already exists for this email. Manage it from Company accounts instead." }, 409);
      }
      if (!existingProfile && callerRole !== "super_admin") {
        return json({ error: "Only a Super Admin can reconcile an orphaned Auth account." }, 403);
      }

      const { error: staleDeleteError } = await adminClient.auth.admin.deleteUser(existingAuthUser.id, false);
      if (staleDeleteError) {
        console.error("Stale Auth identity deletion failed", {
          authUserId: existingAuthUser.id,
          error: staleDeleteError.message,
        });
        return json({ error: "The stale, unactivated Auth account could not be cleared. Try again." }, 500);
      }
      replacedAuthUserId = existingAuthUser.id;
    }

    // Persist the server-selected intent before any email is sent. The
    // recipient never supplies or modifies these authorization values.
    const { data: tracking, error: trackingError } = await adminClient.from("user_invitations").insert({
      email, full_name: fullName, intended_role: role, department,
      invited_by: userData.user.id,
    }).select("id").single();
    if (trackingError || !tracking) {
      console.error("Invitation intent creation failed", { email, error: trackingError?.message ?? null });
      return json({ error: "Invitation tracking could not be created." }, 500);
    }

    const redirectTo = Deno.env.get("AUTH_REDIRECT_URL") ?? "deskflowai://auth/callback";
    const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName }, redirectTo,
    });
    if (inviteError || !invited.user) {
      await adminClient.from("user_invitations").update({
        status: "revoked", revoked_at: new Date().toISOString(),
      }).eq("id", tracking.id);
      console.error("Invitation email delivery failed", {
        email,
        code: inviteError?.code ?? null,
        status: inviteError?.status ?? null,
        error: inviteError?.message ?? "No invited user was returned.",
      });
      const failure = classifyInvitationFailure(inviteError);
      return json({ error: failure.message, code: failure.code }, failure.status);
    }

    const { error: provisioningError } = await adminClient.rpc("provision_invited_user", {
      p_invitation_id: tracking.id,
      p_auth_user_id: invited.user.id,
      p_email: email,
      p_full_name: fullName,
      p_role: role,
      p_department: department,
    });
    if (provisioningError) {
      console.error("Atomic invitation provisioning failed", {
        invitationId: tracking.id,
        authUserId: invited.user.id,
        error: provisioningError.message,
      });
      await adminClient.from("user_invitations").update({
        status: "revoked", revoked_at: new Date().toISOString(), auth_user_id: null,
      }).eq("id", tracking.id);
      await adminClient.auth.admin.deleteUser(invited.user.id);
      return json({ error: "The invitation could not be provisioned. No account was created; try again." }, 500);
    }
    await adminClient.from("account_admin_audit").insert({
      actor_id: userData.user.id, target_id: invited.user.id, action: "invite",
      details: { invitation_id: tracking.id, email, role, department, replaced_auth_user_id: replacedAuthUserId },
    });
    return json({ ok: true });
  }

  if (body.action === "update") {
    const userId = typeof body.userId === "string" ? body.userId : "";
    const role = typeof body.role === "string" ? body.role as Role : undefined;
    const status = typeof body.status === "string" ? body.status : undefined;
    if (!userId || (!role && !status) || (role && !roles.has(role)) || (status && !statuses.has(status))) {
      return json({ error: "The account update is invalid." }, 400);
    }
    if (userId === userData.user.id) {
      return json({ error: "Administrators cannot change their own role or account status." }, 400);
    }

    const { data: target, error: targetError } = await adminClient.from("profiles")
      .select("id,role,status").eq("id", userId).single();
    if (targetError || !target) return json({ error: "Account not found." }, 404);
    if (!canManageRole(callerRole, target.role as Role) || (role && !canManageRole(callerRole, role))) {
      return json({ error: "Only a Super Admin can manage administrator roles and accounts." }, 403);
    }

    const removesActiveSuper = target.role === "super_admin" && target.status === "active" &&
      ((role && role !== "super_admin") || status === "suspended");
    if (removesActiveSuper) {
      const { count } = await adminClient.from("profiles").select("id", { count: "exact", head: true })
        .eq("role", "super_admin").eq("status", "active");
      if ((count ?? 0) <= 1) return json({ error: "The last active Super Admin cannot be removed." }, 409);
    }

    const changes = { ...(role ? { role } : {}), ...(status ? { status } : {}) };
    const { error: updateError } = await adminClient.from("profiles").update(changes).eq("id", userId);
    if (updateError) return json({ error: updateError.message }, 400);
    await adminClient.from("account_admin_audit").insert({
      actor_id: userData.user.id, target_id: userId,
      action: role ? "role_change" : "status_change", details: changes,
    });
    return json({ ok: true });
  }

  if (body.action === "resend" || body.action === "revoke") {
    const invitationId = typeof body.invitationId === "string" ? body.invitationId : "";
    const { data: invitation, error: invitationError } = await adminClient.from("user_invitations")
      .select("id,auth_user_id,email,full_name,intended_role,department,status")
      .eq("id", invitationId).single();
    if (!invitationId || invitationError || !invitation) return json({ error: "Invitation not found." }, 404);
    if (!canManageRole(callerRole, invitation.intended_role as Role)) {
      return json({ error: "Only a Super Admin can manage administrator invitations." }, 403);
    }
    if (!["pending", "expired", "accepted"].includes(invitation.status)) {
      return json({ error: "Only pending, expired, or unactivated accepted invitations can be changed." }, 409);
    }
    if (invitation.status === "accepted") {
      if (!invitation.auth_user_id) {
        return json({ error: "The accepted invitation is not linked to an account." }, 409);
      }
      const { data: acceptedProfile, error: acceptedProfileError } = await adminClient.from("profiles")
        .select("role,status").eq("id", invitation.auth_user_id).maybeSingle();
      if (acceptedProfileError) {
        return json({ error: "The accepted account profile could not be checked." }, 500);
      }
      if (acceptedProfile && !canManageRole(callerRole, acceptedProfile.role as Role)) {
        return json({ error: "Only a Super Admin can change this administrator invitation." }, 403);
      }
      if (!acceptedProfile && callerRole !== "super_admin") {
        return json({ error: "Only a Super Admin can reconcile this orphaned invitation." }, 403);
      }
      if (acceptedProfile && acceptedProfile.status !== "invited") {
        return json({ error: "An accepted invitation can be changed only before its account is activated." }, 409);
      }
    }

    const previousUserId = invitation.auth_user_id as string | null;
    if (body.action === "revoke") {
      await adminClient.from("user_invitations").update({
        status: "revoked", revoked_at: new Date().toISOString(), auth_user_id: null,
      }).eq("id", invitation.id);
      if (previousUserId) await adminClient.auth.admin.deleteUser(previousUserId);
      await adminClient.from("account_admin_audit").insert({
        actor_id: userData.user.id, target_id: null, action: "invite_revoke",
        details: { invitation_id: invitation.id, email: invitation.email, role: invitation.intended_role },
      });
      return json({ ok: true });
    }

    if (previousUserId) {
      await adminClient.from("user_invitations").update({ auth_user_id: null }).eq("id", invitation.id);
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(previousUserId);
      if (deleteError) return json({ error: "The previous invitation could not be replaced." }, 500);
    }
    const nextExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error: resetError } = await adminClient.from("user_invitations").update({
      auth_user_id: null, status: "pending", expires_at: nextExpiry,
      accepted_at: null, revoked_at: null,
    }).eq("id", invitation.id);
    if (resetError) return json({ error: "The invitation could not be prepared for resend." }, 500);

    const redirectTo = Deno.env.get("AUTH_REDIRECT_URL") ?? "deskflowai://auth/callback";
    const { data: reinvited, error: reinviteError } = await adminClient.auth.admin.inviteUserByEmail(invitation.email, {
      data: { full_name: invitation.full_name }, redirectTo,
    });
    if (reinviteError || !reinvited.user) {
      await adminClient.from("user_invitations").update({ status: "expired" }).eq("id", invitation.id);
      console.error("Invitation resend email delivery failed", {
        invitationId: invitation.id,
        email: invitation.email,
        code: reinviteError?.code ?? null,
        status: reinviteError?.status ?? null,
        error: reinviteError?.message ?? "No invited user was returned.",
      });
      const failure = classifyInvitationFailure(reinviteError);
      return json({ error: failure.message, code: failure.code }, failure.status);
    }
    const { error: reprovisionError } = await adminClient.rpc("provision_invited_user", {
      p_invitation_id: invitation.id,
      p_auth_user_id: reinvited.user.id,
      p_email: invitation.email,
      p_full_name: invitation.full_name,
      p_role: invitation.intended_role,
      p_department: invitation.department,
    });
    if (reprovisionError) {
      console.error("Atomic invitation reprovisioning failed", {
        invitationId: invitation.id,
        authUserId: reinvited.user.id,
        error: reprovisionError.message,
      });
      await adminClient.auth.admin.deleteUser(reinvited.user.id);
      await adminClient.from("user_invitations").update({
        auth_user_id: null, status: "expired",
      }).eq("id", invitation.id);
      return json({ error: "The replacement invitation could not be provisioned." }, 500);
    }
    await adminClient.from("account_admin_audit").insert({
      actor_id: userData.user.id, target_id: reinvited.user.id, action: "invite_resend",
      details: { invitation_id: invitation.id, email: invitation.email, role: invitation.intended_role },
    });
    return json({ ok: true });
  }

  return json({ error: "Unknown administrative action." }, 400);
});
