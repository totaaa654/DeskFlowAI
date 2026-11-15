import { useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FieldLabel, FormMessage, SubmitButton } from "@/components/auth/AuthFields";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import type { Theme } from "@/hooks/useTheme";
import { validateEmail } from "@/lib/auth-validation";

interface ForgotPasswordPageProps { theme: Theme; onToggleTheme: () => void }

export function ForgotPasswordPage({ theme, onToggleTheme }: ForgotPasswordPageProps) {
  const { configured, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!configured) return <Navigate to="/configuration" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateEmail(email);
    if (validationError) return setError(validationError);
    setBusy(true);
    setError(null);
    const result = await sendPasswordReset(email);
    setBusy(false);
    if (result.error) setError(result.error);
    else setSent(true);
  };

  return (
    <AuthLayout eyebrow="Account recovery" title="Reset your password" description="We’ll send a secure recovery link to your company email." theme={theme} onToggleTheme={onToggleTheme}>
      {sent ? (
        <div className="space-y-5">
          <FormMessage type="success">If an account exists for {email}, a password reset link has been sent. Open it on this computer to continue.</FormMessage>
          <Link to="/login" className="flex items-center justify-center gap-2 text-xs font-semibold text-primary hover:underline"><ArrowLeft className="size-3.5" /> Return to sign in</Link>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          {error && <FormMessage type="error">{error}</FormMessage>}
          <div>
            <FieldLabel htmlFor="recovery-email">Company email</FieldLabel>
            <Input id="recovery-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" className="h-11" />
          </div>
          <SubmitButton busy={busy}>Send recovery link</SubmitButton>
          <Link to="/login" className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Back to sign in</Link>
        </form>
      )}
    </AuthLayout>
  );
}
