import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getNavigationItem } from "@/data/navigation";
import { useTheme } from "@/hooks/useTheme";
import { DashboardPage } from "@/pages/DashboardPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import type { PageId } from "@/types/navigation";

function App() {
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, toggleTheme } = useTheme();
  const page = getNavigationItem(activePage);

  const navigate = (nextPage: PageId) => {
    setActivePage(nextPage);
    if (nextPage !== "dashboard") setSearchQuery("");
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen min-h-[720px] min-w-[1024px] overflow-hidden bg-background text-foreground">
        <Sidebar
          activePage={activePage}
          collapsed={sidebarCollapsed}
          onNavigate={navigate}
          onToggle={() => setSidebarCollapsed((current) => !current)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            page={page}
            theme={theme}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onToggleTheme={toggleTheme}
            onNavigate={navigate}
          />
          <div className="min-h-0 flex-1">
            {activePage === "dashboard" ? (
              <DashboardPage searchQuery={searchQuery} />
            ) : (
              <PlaceholderPage page={page} />
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default App;

