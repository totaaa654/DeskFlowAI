import { ChevronsLeft, ChevronsRight, ShieldCheck, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { NavigationItem, PageId } from "@/types/navigation";
import { roleLabels, type Profile } from "@/types/auth";

interface SidebarProps {
  activePage: PageId;
  collapsed: boolean;
  onNavigate: (page: PageId) => void;
  onToggle: () => void;
  items: NavigationItem[];
  profile: Profile;
}

export function Sidebar({ activePage, collapsed, onNavigate, onToggle, items, profile }: SidebarProps) {
  return (
    <aside
      className={cn(
        "relative z-20 flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out",
        collapsed ? "w-[68px]" : "w-[240px]",
      )}
      aria-label="Primary navigation"
    >
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-[14px]">
        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
          <Workflow className="size-5" strokeWidth={2.25} aria-hidden="true" />
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-sidebar bg-sky-400" />
        </div>
        {!collapsed && (
          <div className="min-w-0 animate-in fade-in duration-200">
            <p className="truncate text-[17px] font-bold tracking-tight">
              DeskFlow <span className="text-primary">AI</span>
            </p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Service Desk
            </p>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 py-5">
        {!collapsed && (
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Workspace
          </p>
        )}
        <nav className="space-y-1" aria-label="Administrator workspace">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activePage;
            const button = (
              <Button
                key={item.id}
                variant="ghost"
                type="button"
                aria-current={isActive ? "page" : undefined}
                aria-label={collapsed ? item.label : undefined}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "relative h-10 w-full justify-start gap-3 rounded-lg px-3 text-[13px] font-medium text-muted-foreground transition-colors",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-0",
                  isActive &&
                    "bg-sidebar-accent font-semibold text-sidebar-primary hover:bg-sidebar-accent hover:text-sidebar-primary",
                  item.accent === "ai" && !isActive && "text-violet-600 dark:text-violet-300",
                )}
              >
                {isActive && (
                  <span className="absolute left-0 h-5 w-0.5 rounded-r-full bg-sidebar-primary" />
                )}
                <Icon className="size-[18px] shrink-0" strokeWidth={isActive ? 2.25 : 1.9} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Button>
            );

            return collapsed ? (
              <Tooltip key={item.id} delayDuration={150}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              button
            );
          })}
        </nav>
      </div>

      <div className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-muted/70 px-3 py-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{roleLabels[profile.role]}</p>
              <p className="truncate text-[10px] text-muted-foreground">Role-based workspace</p>
            </div>
          </div>
        )}
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              type="button"
              onClick={onToggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(
                "h-9 w-full justify-center gap-2 border-sidebar-border bg-transparent text-muted-foreground shadow-none",
                !collapsed && "justify-start px-3",
              )}
            >
              {collapsed ? (
                <ChevronsRight className="size-4" />
              ) : (
                <>
                  <ChevronsLeft className="size-4" />
                  <span className="text-xs">Collapse sidebar</span>
                </>
              )}
            </Button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Expand sidebar</TooltipContent>}
        </Tooltip>
      </div>
    </aside>
  );
}

