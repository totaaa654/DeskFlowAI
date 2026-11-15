import {
  BarChart3, Bell, Bot, CirclePlus, Cog, LayoutDashboard, Settings,
  ShieldCheck, TicketCheck, UserRoundCheck, Users,
} from "lucide-react";
import type { NavigationItem, PageId } from "@/types/navigation";
import type { UserRole } from "@/types/auth";

const allRoles: UserRole[] = ["employee", "technician", "it_admin", "super_admin"];
const admins: UserRole[] = ["it_admin", "super_admin"];

export const navigationItems: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", description: "Overview and recent service desk activity", icon: LayoutDashboard, roles: allRoles },
  { id: "my-tickets", label: "My Tickets", description: "Track your submitted support requests", icon: TicketCheck, roles: ["employee"] },
  { id: "create-ticket", label: "Create Ticket", description: "Submit a new support request", icon: CirclePlus, roles: ["employee"] },
  { id: "assigned-tickets", label: "Assigned Tickets", description: "Review tickets assigned to you", icon: UserRoundCheck, roles: ["technician"] },
  { id: "tickets", label: "Ticket Management", description: "Search, assign, and manage support tickets", icon: TicketCheck, roles: ["technician", ...admins] },
  { id: "users", label: "User Management", description: "Manage company users and invitations", icon: Users, roles: admins },
  { id: "administrators", label: "Administrator Roles", description: "Manage IT Admin and Super Admin access", icon: ShieldCheck, roles: ["super_admin"] },
  { id: "automation", label: "Automation Workflows", description: "Configure routing, SLA, and lifecycle rules", icon: Bot, accent: "ai", roles: admins },
  { id: "notifications", label: "Notifications", description: "Review assignments, updates, and alerts", icon: Bell, roles: allRoles },
  { id: "reports", label: "Reports & Analytics", description: "Monitor workloads and operational trends", icon: BarChart3, roles: admins },
  { id: "system", label: "System Configuration", description: "Manage organization-wide DeskFlow settings", icon: Cog, roles: ["super_admin"] },
  { id: "settings", label: "Settings", description: "Application preferences and integrations", icon: Settings, roles: allRoles },
];

export function getNavigationItem(pageId: PageId): NavigationItem {
  return navigationItems.find((item) => item.id === pageId) ?? navigationItems[0];
}

export function getNavigationForRole(role: UserRole): NavigationItem[] {
  return navigationItems.filter((item) => item.roles.includes(role));
}
