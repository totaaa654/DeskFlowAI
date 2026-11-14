import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  accent: "blue" | "sky" | "violet" | "green";
  trend?: "up" | "down";
}

const accentStyles = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
  green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
};

export function StatCard({ label, value, detail, icon: Icon, accent, trend }: StatCardProps) {
  return (
    <Card className="rounded-xl border bg-card py-0 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <div className={cn("flex size-9 items-center justify-center rounded-lg", accentStyles[accent])}>
            <Icon className="size-[18px]" strokeWidth={2} aria-hidden="true" />
          </div>
        </div>
        <p className="text-[28px] font-bold leading-none tracking-tight tabular-nums">{value}</p>
        <div className="mt-3 flex min-h-4 items-center gap-1 text-[10px]">
          {trend === "up" && <ArrowUpRight className="size-3.5 text-emerald-500" />}
          {trend === "down" && <ArrowDownRight className="size-3.5 text-amber-500" />}
          <span className={cn(trend === "up" ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
            {detail}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

