import { useState, type FormEvent } from "react";
import { ArrowLeft, MailCheck, ShieldCheck } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FieldLabel, FormMessage, PasswordInput, SubmitButton } from "@/components/auth/AuthFields";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import type { Theme } from "@/hooks/useTheme";
import { validateNewPassword } from "@/lib/auth-validation";

interface CreateAccountPageProps { theme: Theme; onToggleTheme: () => void }

export function CreateAccountPage({ theme, onToggleTheme }: CreateAccountPageProps) {
  const { configured, session, profile, setNewPassword } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);

  if (!configured) return <Navigate to="/configuration" replace />;
  if (complete || (session && profile?.status === "active")) return <Navigate to="/app/dashboard" replace />;
  const hasInvitation = Boolean(session && profile?.status === "invited");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = !fullName.trim()
      ? "Enter your full name."
      : validateNewPassword(password) ?? (password !== confirmation ? "Passwords do not match." : null);
    if (validationError) return setError(validationError);
    setBusy(true);
    setError(null);
    const result = await setNewPassword(password, fullName);
    setBusy(false);
    if (result.error) setError(result.error);
    else setComplete(true);
  };

  return (
    <AuthLayout eyebrow="Invitation-only registration" title={hasInvitation ? "Create your company account" : "Join your company workspace"} description={hasInvitation ? "Finish your administrator-approved invitation by choosing a secure password." : "DeskFlow accounts are provisioned by an authorized company administrator."} theme={theme} onToggleTheme={onToggleTheme}>
      {hasInvitation ? (
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {error && <FormMessage type="error">{error}</FormMessage>}
          <FormMessage type="info">Invitation verified for {session?.user.email}. Your assigned access level cannot be changed here.</FormMessage>
          <div>
            <FieldLabel htmlFor="full-name">Full name</FieldLabel>
            <Input id="full-name" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" className="h-11" />
          </div>
          <div>
            <FieldLabel htmlFor="new-password">Create password</FieldLabel>
            <PasswordInput id="new-password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
            <p className="mt-1.5 text-[11px] text-muted-foreground">Use uppercase, lowercase, and a number.</p>
          </div>
          <div>
            <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
            <PasswordInput id="confirm-password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repeat your password" />
          </div>
          <SubmitButton busy={busy}>Activate account</SubmitButton>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border bg-muted/45 p-5">
            <div className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><MailCheck className="size-5" /></div>
              <div><h2 className="text-sm font-semibold">Ask your administrator for an invite</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">They will select your role and send a time-limited link to your company email.</p></div>
            </div>
            <div className="mt-4 flex gap-4 border-t pt-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="size-5" /></div>
              <div><h2 className="text-sm font-semibold">Open the link on this computer</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">DeskFlow will verify the invitation, then let you create a password securely.</p></div>
            </div>
          </div>
          <FormMessage type="info">Public self-registration is intentionally disabled. Registration links never allow a user to choose an administrator or technician role.</FormMessage>
          <Link to="/login" className="flex items-center justify-center gap-2 text-xs font-semibold text-primary hover:underline"><ArrowLeft className="size-3.5" /> Return to sign in</Link>
        </div>
      )}
    </AuthLayout>
  );
}
