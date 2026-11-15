import { useState } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { getNavigationForRole, getNavigationItem } from "@/data/navigation";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { DashboardPage } from "@/pages/DashboardPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { UserManagementPage } from "@/pages/UserManagementPage";
import { AccountStatePage, LoadingScreen } from "@/pages/auth/AccountStatePage";
import { ConfigurationPage } from "@/pages/auth/ConfigurationPage";
import { CreateAccountPage } from "@/pages/auth/CreateAccountPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import type { PageId } from "@/types/navigation";

interface ThemeProps { theme: Theme; onToggleTheme: () => void }

function AppShell({ theme, onToggleTheme }: ThemeProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [shellError, setShellError] = useState<string | null>(null);
  if (!profile) return null;

  const pathParts = location.pathname.split("/").filter(Boolean);
  const routePage = pathParts[pathParts.length - 1] as PageId | undefined;
  const items = getNavigationForRole(profile.role);
  const activePage = routePage && items.some((item) => item.id === routePage) ? routePage : "dashboard";
  if (routePage && !items.some((item) => item.id === routePage)) return <Navigate to="/app/dashboard" replace />;
  const page = getNavigationItem(activePage);

  const goTo = (nextPage: PageId) => {
    if (!items.some((item) => item.id === nextPage)) return;
    navigate(`/app/${nextPage}`);
    if (nextPage !== "dashboard") setSearchQuery("");
  };

  const handleSignOut = async () => {
    setShellError(null);
    const result = await signOut();
    if (result.error) setShellError(`Sign out failed: ${result.error}`);
  };

  return (
    <div className="flex h-screen min-h-[720px] min-w-[1024px] overflow-hidden bg-background text-foreground">
      <Sidebar activePage={activePage} collapsed={sidebarCollapsed} onNavigate={goTo} onToggle={() => setSidebarCollapsed((current) => !current)} items={items} profile={profile} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar page={page} theme={theme} searchQuery={searchQuery} onSearchChange={setSearchQuery} onToggleTheme={onToggleTheme} onNavigate={goTo} profile={profile} onSignOut={() => void handleSignOut()} />
        {shellError && <div role="alert" className="border-b border-red-200 bg-red-50 px-6 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">{shellError}</div>}
        <div className="min-h-0 flex-1">
          {activePage === "dashboard" ? <DashboardPage searchQuery={searchQuery} profile={profile} /> : activePage === "users" && ["it_admin", "super_admin"].includes(profile.role) ? <UserManagementPage /> : <PlaceholderPage page={page} />}
        </div>
      </div>
    </div>
  );
}

function AuthenticatedArea({ theme, onToggleTheme }: ThemeProps) {
  const { loading, session, profile, profileError, callbackKind } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  if (callbackKind === "recovery") return <Navigate to="/reset-password" replace />;
  if (profileError) return <AccountStatePage state="error" />;
  if (!profile) return <LoadingScreen />;
  if (profile.status === "invited") return <Navigate to="/create-account" replace />;
  if (profile.status === "pending") return <AccountStatePage state="pending" />;
  if (profile.status === "suspended") return <AccountStatePage state="suspended" />;
  return <AppShell theme={theme} onToggleTheme={onToggleTheme} />;
}

function AppRoutes({ theme, onToggleTheme }: ThemeProps) {
  const { loading, session, profile, callbackKind } = useAuth();
  if (loading) return <LoadingScreen />;
  if (callbackKind === "recovery") return <ResetPasswordPage theme={theme} onToggleTheme={onToggleTheme} />;
  if (callbackKind === "invite" && session && !profile) return <LoadingScreen />;
  if (callbackKind === "invite") return <CreateAccountPage theme={theme} onToggleTheme={onToggleTheme} />;
  return (
    <Routes>
      <Route path="/configuration" element={<ConfigurationPage theme={theme} onToggleTheme={onToggleTheme} />} />
      <Route path="/login" element={<LoginPage theme={theme} onToggleTheme={onToggleTheme} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage theme={theme} onToggleTheme={onToggleTheme} />} />
      <Route path="/create-account" element={<CreateAccountPage theme={theme} onToggleTheme={onToggleTheme} />} />
      <Route path="/reset-password" element={<ResetPasswordPage theme={theme} onToggleTheme={onToggleTheme} />} />
      <Route path="/app/*" element={<AuthenticatedArea theme={theme} onToggleTheme={onToggleTheme} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  const { theme, toggleTheme } = useTheme();
  return (
    <TooltipProvider>
      <HashRouter>
        <AuthProvider><AppRoutes theme={theme} onToggleTheme={toggleTheme} /></AuthProvider>
      </HashRouter>
    </TooltipProvider>
  );
}

export default App;
