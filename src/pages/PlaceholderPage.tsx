import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { NavigationItem } from "@/types/navigation";

export function PlaceholderPage({ page }: { page: NavigationItem }) {
  const Icon = page.icon;
  const isAiWorkflow = page.accent === "ai";

  return (
    <main className="h-full overflow-y-auto bg-background p-6">
      <Card className="max-w-2xl rounded-xl py-0 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <CardContent className="flex items-start gap-5 p-6">
          <div
            className={
              isAiWorkflow
                ? "flex size-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300"
                : "flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
            }
          >
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <Badge variant="secondary" className="mb-3 rounded-full text-[10px] font-bold uppercase tracking-wide">
              Phase 1 placeholder
            </Badge>
            <h2 className="text-lg font-bold">{page.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{page.description}.</p>
            <div className="mt-5 rounded-lg border bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
              This workspace is intentionally unavailable in Phase 1. The navigation and application shell
              are ready; full business logic and cloud data will be added in a later milestone.
              {isAiWorkflow && (
                <p className="mt-2 font-medium text-violet-700 dark:text-violet-300">
                  Future AI features here are limited to administrative workflow automation—not technical
                  diagnosis or troubleshooting.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

