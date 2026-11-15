import { Clock3, LoaderCircle, ShieldX, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function LoadingScreen() {
  return <main className="flex h-screen min-h-[720px] min-w-[1024px] items-center justify-center bg-background"><div className="text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Workflow className="size-5" /></div><LoaderCircle className="mx-auto mt-5 size-5 animate-spin text-primary" /><p className="mt-3 text-xs font-medium text-muted-foreground">Restoring your secure session…</p></div></main>;
}

export function AccountStatePage({ state }: { state: "pending" | "suspended" | "error" }) {
  const { signOut, profileError } = useAuth();
  const content = state === "pending"
    ? { icon: Clock3, title: "Account awaiting approval", description: "Your account exists, but an administrator must approve access before you can enter the workspace." }
    : state === "suspended"
      ? { icon: ShieldX, title: "Account access suspended", description: "This account has been suspended. Contact your DeskFlow administrator if you believe this is a mistake." }
      : { icon: ShieldX, title: "Profile unavailable", description: profileError ?? "DeskFlow could not load your authorization profile." };
  const Icon = content.icon;
  return <main className="flex h-screen min-h-[720px] min-w-[1024px] items-center justify-center bg-background p-8"><div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-xl shadow-slate-950/5"><div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-5" /></div><h1 className="mt-5 text-xl font-bold">{content.title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{content.description}</p><Button variant="outline" className="mt-6" onClick={() => void signOut()}>Return to sign in</Button></div></main>;
}
