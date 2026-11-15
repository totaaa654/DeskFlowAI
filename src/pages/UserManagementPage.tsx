import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Ban, LoaderCircle, MailPlus, RefreshCw, RotateCw, Search, ShieldCheck,
  UserCheck, UserX, Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { validateEmail } from "@/lib/auth-validation";
import { canAdminManageRole } from "@/lib/role-permissions";
import { cn } from "@/lib/utils";
import {
  inviteUser, listInvitations, listProfiles, resendInvitation,
  revokeInvitation, updateUserAccount, verifyAdminAccess,
} from "@/services/admin-users";
import {
  roleLabels, type InvitationStatus, type Profile, type UserInvitation, type UserRole,
} from "@/types/auth";

const allRoles: UserRole[] = ["employee", "technician", "it_admin", "super_admin"];

function invitationDisplayStatus(invitation: UserInvitation): InvitationStatus {
  return invitation.status === "pending" && new Date(invitation.expires_at).getTime() <= Date.now()
    ? "expired"
    : invitation.status;
}

function StatusPill({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn(
      "capitalize",
      ["active", "accepted"].includes(status) && "border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-300",
      ["suspended", "revoked"].includes(status) && "border-red-200 text-red-700 dark:border-red-900 dark:text-red-300",
      status === "expired" && "border-amber-200 text-amber-700 dark:border-amber-900 dark:text-amber-300",
    )}>{status}</Badge>
  );
}

export function UserManagementPage() {
  const { profile: currentProfile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<UserRole>("employee");
  const [inviting, setInviting] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

  const isSuperAdmin = currentProfile?.role === "super_admin";
  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const [nextProfiles, nextInvitations] = await Promise.all([
        listProfiles(), listInvitations(), verifyAdminAccess(),
      ]);
      setProfiles(nextProfiles);
      setInvitations(nextInvitations);
    } catch (cause) {
      if (!silent) setError(cause instanceof Error ? cause.message : "Unable to load account management data.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    const refreshTimer = window.setInterval(refreshWhenVisible, 15_000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [load]);

  const totals = useMemo(() => ({
    active: profiles.filter((item) => item.status === "active").length,
    invited: invitations.filter((item) => invitationDisplayStatus(item) === "pending").length,
    privileged: profiles.filter((item) => ["it_admin", "super_admin"].includes(item.role)).length,
  }), [invitations, profiles]);

  const filteredProfiles = useMemo(() => {
    const search = query.trim().toLowerCase();
    return profiles.filter((item) =>
      (roleFilter === "all" || item.role === roleFilter) &&
      (!search || item.full_name.toLowerCase().includes(search) || item.email.toLowerCase().includes(search))
    );
  }, [profiles, query, roleFilter]);

  const submitInvite = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateEmail(email)
      ?? (!fullName.trim() ? "Enter the person's full name." : null)
      ?? (department.trim().length > 120 ? "Department must be 120 characters or fewer." : null);
    if (validationError) return setError(validationError);
    setInviting(true); setError(null); setSuccess(null);
    try {
      await inviteUser({ email, fullName, role, department: department.trim() || undefined });
      setSuccess(`Invitation sent to ${email.trim().toLowerCase()} as ${roleLabels[role]}.`);
      setEmail(""); setFullName(""); setDepartment(""); setRole("employee");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to send the invitation."); }
    finally { setInviting(false); }
  };

  const updateAccount = async (target: Profile, changes: { role?: UserRole; status?: "active" | "suspended" }) => {
    const action = changes.role ? `change ${target.email} to ${roleLabels[changes.role]}` : `${changes.status === "suspended" ? "deactivate" : "activate"} ${target.email}`;
    if (!window.confirm(`Confirm you want to ${action}?`)) return;
    setWorkingId(target.id); setError(null); setSuccess(null);
    try {
      await updateUserAccount(target.id, changes);
      setSuccess(`${target.email} was updated successfully.`);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update the account."); }
    finally { setWorkingId(null); }
  };

  const changeInvitation = async (invitation: UserInvitation, action: "resend" | "revoke") => {
    if (!window.confirm(`${action === "resend" ? "Resend" : "Revoke"} the invitation for ${invitation.email}?`)) return;
    setWorkingId(invitation.id); setError(null); setSuccess(null);
    try {
      if (action === "resend") await resendInvitation(invitation.id);
      else await revokeInvitation(invitation.id);
      setSuccess(`Invitation for ${invitation.email} was ${action === "resend" ? "resent" : "revoked"}.`);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : `Unable to ${action} the invitation.`); }
    finally { setWorkingId(null); }
  };

  return (
    <main className="h-full overflow-y-auto bg-background p-6" aria-labelledby="users-heading">
      <div className="mx-auto max-w-[1440px] space-y-5">
        <section className="flex items-start justify-between gap-4">
          <div><h2 id="users-heading" className="text-[22px] font-bold tracking-tight">User management</h2><p className="mt-1 text-xs text-muted-foreground">Invite users and manage database-enforced company access.</p></div>
          <Badge variant="outline" className="gap-1.5 rounded-full border-blue-200 bg-blue-50 px-3 text-[10px] font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"><ShieldCheck className="size-3" /> {isSuperAdmin ? "Super Admin" : "IT Admin"}</Badge>
        </section>

        {(error || success) && <div role={error ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-xs", error ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300")}>{error ?? success}</div>}

        <section className="grid grid-cols-3 gap-4" aria-label="Account summary">
          {[{ label: "Active accounts", value: totals.active, icon: UserCheck }, { label: "Pending invitations", value: totals.invited, icon: MailPlus }, { label: "Administrator accounts", value: totals.privileged, icon: ShieldCheck }].map((item) => <Card key={item.label} className="py-4"><CardContent className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><item.icon className="size-4" /></div><div><p className="text-xl font-bold">{item.value}</p><p className="text-[11px] text-muted-foreground">{item.label}</p></div></CardContent></Card>)}
        </section>

        <section className="grid grid-cols-[340px_minmax(0,1fr)] gap-5">
          <Card className="h-fit">
            <CardHeader><CardTitle className="flex items-center gap-2"><MailPlus className="size-4 text-primary" /> Invite a company user</CardTitle><p className="text-xs leading-5 text-muted-foreground">The selected role is stored server-side before the invitation is sent.</p></CardHeader>
            <CardContent><form className="space-y-4" onSubmit={submitInvite}>
              <div><label htmlFor="invite-name" className="mb-1.5 block text-xs font-semibold">Full name</label><Input id="invite-name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Alex Morgan" className="h-10" /></div>
              <div><label htmlFor="invite-email" className="mb-1.5 block text-xs font-semibold">Email address</label><Input id="invite-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="alex@company.com" className="h-10" /></div>
              <div><label htmlFor="invite-role" className="mb-1.5 block text-xs font-semibold">Assign role</label><select id="invite-role" value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/30">{allRoles.map((item) => <option key={item} value={item} disabled={!currentProfile || !canAdminManageRole(currentProfile.role, item)}>{roleLabels[item]}</option>)}</select>{!isSuperAdmin && <p className="mt-1.5 text-[10px] text-muted-foreground">Only Super Admins can assign administrator roles.</p>}</div>
              <div><label htmlFor="invite-department" className="mb-1.5 block text-xs font-semibold">Department <span className="font-normal text-muted-foreground">(optional)</span></label><Input id="invite-department" value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Finance, Operations, IT..." maxLength={120} className="h-10" /></div>
              <Button type="submit" disabled={inviting} className="h-10 w-full">{inviting ? <LoaderCircle className="animate-spin" /> : <MailPlus />} Send secure invitation</Button>
            </form></CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b"><div className="flex items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><Users className="size-4 text-primary" /> Company accounts</CardTitle><p className="mt-1 text-xs text-muted-foreground">{filteredProfiles.length} of {profiles.length} accounts shown.</p></div><Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className={cn(loading && "animate-spin")} /> Refresh</Button></div><div className="mt-3 flex gap-2"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email" className="h-9 pl-9 text-xs" /></div><select aria-label="Filter users by role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | "all")} className="h-9 rounded-lg border bg-background px-3 text-xs"><option value="all">All roles</option>{allRoles.map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}</select></div></CardHeader>
            <CardContent className="px-0">
              {loading ? <div className="flex h-48 items-center justify-center"><LoaderCircle className="size-5 animate-spin text-primary" /></div> : filteredProfiles.length === 0 ? <div className="flex h-48 flex-col items-center justify-center text-muted-foreground"><Users className="mb-2 size-6" /><p className="text-xs">No matching profiles found.</p></div> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b bg-muted/35 text-[10px] uppercase tracking-wider text-muted-foreground"><th className="px-4 py-3 font-bold">User</th><th className="px-4 py-3 font-bold">Department</th><th className="px-4 py-3 font-bold">Role</th><th className="px-4 py-3 font-bold">Status</th><th className="px-4 py-3 text-right font-bold">Access</th></tr></thead><tbody>{filteredProfiles.map((item) => {
                const busy = workingId === item.id; const isSelf = item.id === currentProfile?.id;
                const canManage = !isSelf && Boolean(currentProfile && canAdminManageRole(currentProfile.role, item.role));
                return <tr key={item.id} className="border-b last:border-0"><td className="px-4 py-3"><p className="text-xs font-semibold">{item.full_name || "Invited user"}{isSelf && <span className="ml-1 text-[10px] text-primary">(you)</span>}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{item.email}</p></td><td className="px-4 py-3 text-[11px] text-muted-foreground">{item.department || "—"}</td><td className="px-4 py-3"><select aria-label={`Role for ${item.email}`} value={item.role} disabled={busy || !canManage} onChange={(event) => void updateAccount(item, { role: event.target.value as UserRole })} className="h-8 max-w-36 rounded-lg border bg-background px-2 text-[11px]">{allRoles.map((nextRole) => <option key={nextRole} value={nextRole} disabled={!currentProfile || !canAdminManageRole(currentProfile.role, nextRole)}>{roleLabels[nextRole]}</option>)}</select></td><td className="px-4 py-3"><StatusPill status={item.status} /></td><td className="px-4 py-3 text-right">{busy ? <LoaderCircle className="ml-auto size-4 animate-spin" /> : item.status === "pending" ? <Button variant="ghost" size="sm" disabled={!canManage} onClick={() => void updateAccount(item, { status: "active" })}><UserCheck /> Approve</Button> : item.status === "suspended" ? <Button variant="ghost" size="sm" disabled={!canManage} onClick={() => void updateAccount(item, { status: "active" })}><UserCheck /> Activate</Button> : <Button variant="ghost" size="sm" disabled={!canManage} onClick={() => void updateAccount(item, { status: "suspended" })} className="text-destructive"><UserX /> Deactivate</Button>}</td></tr>;
              })}</tbody></table></div>}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="border-b"><CardTitle className="flex items-center gap-2"><MailPlus className="size-4 text-primary" /> Invitation activity</CardTitle><p className="text-xs text-muted-foreground">Pending links expire after 24 hours. Accepted and revoked invitations remain visible for audit context.</p></CardHeader>
          <CardContent className="px-0">{loading ? <div className="flex h-32 items-center justify-center"><LoaderCircle className="size-5 animate-spin text-primary" /></div> : invitations.length === 0 ? <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">No invitations have been sent.</div> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b bg-muted/35 text-[10px] uppercase tracking-wider text-muted-foreground"><th className="px-4 py-3 font-bold">Recipient</th><th className="px-4 py-3 font-bold">Role</th><th className="px-4 py-3 font-bold">Department</th><th className="px-4 py-3 font-bold">Status</th><th className="px-4 py-3 font-bold">Expires</th><th className="px-4 py-3 text-right font-bold">Actions</th></tr></thead><tbody>{invitations.map((item) => {
            const displayStatus = invitationDisplayStatus(item); const busy = workingId === item.id;
            const manageable = Boolean(currentProfile && canAdminManageRole(currentProfile.role, item.intended_role));
            const invitedProfile = item.auth_user_id
              ? profiles.find((profile) => profile.id === item.auth_user_id)
              : undefined;
            const acceptedButUnactivated = displayStatus === "accepted"
              && (!item.auth_user_id || !invitedProfile || invitedProfile.status === "invited");
            const actionable = manageable && (["pending", "expired"].includes(displayStatus) || acceptedButUnactivated);
            return <tr key={item.id} className="border-b last:border-0"><td className="px-4 py-3"><p className="text-xs font-semibold">{item.full_name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{item.email}</p></td><td className="px-4 py-3 text-[11px]">{roleLabels[item.intended_role]}</td><td className="px-4 py-3 text-[11px] text-muted-foreground">{item.department || "—"}</td><td className="px-4 py-3"><StatusPill status={displayStatus} /></td><td className="px-4 py-3 text-[10px] text-muted-foreground">{new Date(item.expires_at).toLocaleString()}</td><td className="px-4 py-3"><div className="flex justify-end gap-1">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <><Button variant="ghost" size="sm" disabled={!actionable} onClick={() => void changeInvitation(item, "resend")}><RotateCw /> Resend</Button><Button variant="ghost" size="sm" disabled={!actionable} onClick={() => void changeInvitation(item, "revoke")} className="text-destructive"><Ban /> Revoke</Button></>}</div></td></tr>;
          })}</tbody></table></div>}</CardContent>
        </Card>
      </div>
    </main>
  );
}
