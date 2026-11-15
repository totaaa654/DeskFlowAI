import { CheckCircle2, Moon, ShieldCheck, Sparkles, Sun, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Theme } from "@/hooks/useTheme";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  theme: Theme;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export function AuthLayout({
  eyebrow,
  title,
  description,
  theme,
  onToggleTheme,
  children,
}: AuthLayoutProps) {
  return (
    <main className="relative grid h-screen min-h-[720px] min-w-[1024px] grid-cols-[minmax(500px,0.9fr)_minmax(500px,1.1fr)] overflow-hidden bg-background">
      <section className="relative z-10 flex h-full flex-col bg-card px-12 py-9 xl:px-20" aria-label="Authentication">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Workflow className="size-5" strokeWidth={2.3} />
              <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-card bg-sky-400" />
            </div>
            <div>
              <p className="text-[18px] font-bold tracking-tight">
                DeskFlow <span className="text-primary">AI</span>
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Service Desk
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon-lg"
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            className="size-10 rounded-xl shadow-none"
          >
            {theme === "light" ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
          </Button>
        </div>

        <div className="m-auto w-full max-w-[420px] py-8">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          <h1 className="text-[32px] font-bold leading-tight tracking-[-0.035em]">{title}</h1>
          <p className="mt-3 max-w-[390px] text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Protected by encrypted Supabase authentication and database authorization.
        </p>
      </section>

      <section className="auth-cloud-panel relative flex h-full items-center overflow-hidden px-14 text-white xl:px-20" aria-label="DeskFlow security overview">
        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />
        <div className="relative z-10 max-w-[560px]">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold backdrop-blur-md">
            <Sparkles className="size-3.5 text-sky-200" />
            Cloud Blue workspace
          </div>
          <h2 className="max-w-[520px] text-[40px] font-bold leading-[1.12] tracking-[-0.04em]">
            Support operations, secured from the first sign-in.
          </h2>
          <p className="mt-5 max-w-[480px] text-[15px] leading-7 text-blue-100/90">
            DeskFlow gives every employee, technician, and administrator the right workspace without exposing privileged controls.
          </p>
          <div className="mt-10 grid max-w-[500px] gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
              <ShieldCheck className="mb-3 size-5 text-sky-200" />
              <p className="text-sm font-semibold">Database-enforced access</p>
              <p className="mt-1 text-xs leading-5 text-blue-100/75">Roles and account state are protected by PostgreSQL RLS.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
              <CheckCircle2 className="mb-3 size-5 text-sky-200" />
              <p className="text-sm font-semibold">Invitation-only accounts</p>
              <p className="mt-1 text-xs leading-5 text-blue-100/75">Company access begins with an authorized administrator.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
