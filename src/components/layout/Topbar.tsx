import { Bell, Moon, Search, Sun } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Theme } from "@/hooks/useTheme";
import type { NavigationItem, PageId } from "@/types/navigation";

interface TopbarProps {
  page: NavigationItem;
  theme: Theme;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleTheme: () => void;
  onNavigate: (page: PageId) => void;
}

export function Topbar({
  page,
  theme,
  searchQuery,
  onSearchChange,
  onToggleTheme,
  onNavigate,
}: TopbarProps) {
  const isDashboard = page.id === "dashboard";

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-card px-6">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold tracking-tight">{page.label}</h1>
        <p className="truncate text-[11px] text-muted-foreground">{page.description}</p>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        {isDashboard && (
          <div className="relative hidden w-[248px] xl:block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search recent tickets…"
              aria-label="Search recent tickets"
              className="h-10 rounded-lg bg-background pl-9 shadow-none"
            />
          </div>
        )}

        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-lg"
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              className="size-10 rounded-lg bg-background shadow-none"
            >
              {theme === "light" ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          </TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-lg"
              type="button"
              onClick={() => onNavigate("notifications")}
              aria-label="Open notifications"
              className="relative size-10 rounded-lg bg-background shadow-none"
            >
              <Bell className="size-[18px]" />
              <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-background bg-red-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open notifications</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-7" />

        <div className="flex items-center gap-2.5" aria-label="Signed in account">
          <Avatar className="size-9 rounded-lg">
            <AvatarFallback className="rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              JG
            </AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-xs font-semibold">Jordan Galang</p>
            <p className="truncate text-[10px] text-muted-foreground">IT Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}

