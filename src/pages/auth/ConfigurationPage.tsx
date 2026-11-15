import { Database, FileKey2, ShieldAlert } from "lucide-react";
import { Navigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormMessage } from "@/components/auth/AuthFields";
import { useAuth } from "@/contexts/AuthContext";
import type { Theme } from "@/hooks/useTheme";

interface ConfigurationPageProps { theme: Theme; onToggleTheme: () => void }

export function ConfigurationPage({ theme, onToggleTheme }: ConfigurationPageProps) {
  const { configured } = useAuth();
  if (configured) return <Navigate to="/login" replace />;
  return (
    <AuthLayout eyebrow="Setup required" title="Connect your Supabase project" description="The Phase 2 interface is ready, but real authentication stays disabled until public project values are configured." theme={theme} onToggleTheme={onToggleTheme}>
      <div className="space-y-4">
        <FormMessage type="info">No credentials were invented. Copy <strong>.env.example</strong> to <strong>.env</strong> and add only the public project URL and publishable key.</FormMessage>
        <div className="grid gap-3">
          <div className="flex gap-3 rounded-xl border p-3.5"><Database className="mt-0.5 size-4 shrink-0 text-primary" /><div><p className="text-xs font-semibold">Apply the database migration</p><p className="mt-1 text-[11px] text-muted-foreground">Creates profiles, safe defaults, RLS, and invitation activation.</p></div></div>
          <div className="flex gap-3 rounded-xl border p-3.5"><FileKey2 className="mt-0.5 size-4 shrink-0 text-primary" /><div><p className="text-xs font-semibold">Deploy the admin Edge Function</p><p className="mt-1 text-[11px] text-muted-foreground">Administrative keys remain inside Supabase’s trusted runtime.</p></div></div>
          <div className="flex gap-3 rounded-xl border p-3.5"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" /><div><p className="text-xs font-semibold">Disable public sign-ups</p><p className="mt-1 text-[11px] text-muted-foreground">Company accounts are created only by an administrator invitation.</p></div></div>
        </div>
      </div>
    </AuthLayout>
  );
}
