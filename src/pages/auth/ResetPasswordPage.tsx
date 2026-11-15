import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FieldLabel, FormMessage, PasswordInput, SubmitButton } from "@/components/auth/AuthFields";
import { useAuth } from "@/contexts/AuthContext";
import type { Theme } from "@/hooks/useTheme";
import { validateNewPassword } from "@/lib/auth-validation";

interface ResetPasswordPageProps { theme: Theme; onToggleTheme: () => void }

export function ResetPasswordPage({ theme, onToggleTheme }: ResetPasswordPageProps) {
  const { session, callbackKind, setNewPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);

  if (complete) return <Navigate to="/app/dashboard" replace />;
  if (!session || callbackKind !== "recovery") return <Navigate to="/login" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateNewPassword(password) ?? (password !== confirmation ? "Passwords do not match." : null);
    if (validationError) return setError(validationError);
    setBusy(true);
    setError(null);
    const result = await setNewPassword(password);
    setBusy(false);
    if (result.error) setError(result.error);
    else setComplete(true);
  };

  return (
    <AuthLayout eyebrow="Secure recovery" title="Choose a new password" description="Your recovery link is verified. Create a new password to continue." theme={theme} onToggleTheme={onToggleTheme}>
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {error && <FormMessage type="error">{error}</FormMessage>}
        <div><FieldLabel htmlFor="reset-password">New password</FieldLabel><PasswordInput id="reset-password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
        <div><FieldLabel htmlFor="reset-confirmation">Confirm new password</FieldLabel><PasswordInput id="reset-confirmation" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>
        <SubmitButton busy={busy}>Update password</SubmitButton>
      </form>
    </AuthLayout>
  );
}
