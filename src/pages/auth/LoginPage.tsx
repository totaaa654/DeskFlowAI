import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FieldLabel, FormMessage, PasswordInput, SubmitButton } from "@/components/auth/AuthFields";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import type { Theme } from "@/hooks/useTheme";
import { validateEmail, validatePassword } from "@/lib/auth-validation";

interface LoginPageProps { theme: Theme; onToggleTheme: () => void }

export function LoginPage({ theme, onToggleTheme }: LoginPageProps) {
  const { configured, session, profile, signIn, callbackError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!configured) return <Navigate to="/configuration" replace />;
  if (session && profile?.status === "invited") return <Navigate to="/create-account" replace />;
  if (session && profile) return <Navigate to="/app/dashboard" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateEmail(email) ?? validatePassword(password);
    if (validationError) return setError(validationError);
    setBusy(true);
    setError(null);
    const result = await signIn(email, password);
    setError(result.error);
    setBusy(false);
  };

  return (
    <AuthLayout eyebrow="Welcome back" title="Sign in to your workspace" description="Use your company account to continue to DeskFlow AI." theme={theme} onToggleTheme={onToggleTheme}>
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {(error || callbackError) && <FormMessage type="error">{error ?? callbackError}</FormMessage>}
        <div>
          <FieldLabel htmlFor="email">Company email</FieldLabel>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" className="h-11" aria-invalid={Boolean(error && validateEmail(email))} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link to="/forgot-password" className="mb-2 text-xs font-semibold text-primary hover:underline">Forgot password?</Link>
          </div>
          <PasswordInput id="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
        </div>
        <SubmitButton busy={busy}>Sign in securely</SubmitButton>
      </form>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        New to DeskFlow? <Link to="/create-account" className="font-semibold text-primary hover:underline">Create an invited account</Link>
      </p>
    </AuthLayout>
  );
}
