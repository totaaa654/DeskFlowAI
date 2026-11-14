import {
  BarChart3,
  Bell,
  Bot,
  LayoutDashboard,
  Settings,
  TicketCheck,
  Users,
} from "lucide-react";
import type { NavigationItem, PageId } from "@/types/navigation";

export const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Overview and recent service desk activity",
    icon: LayoutDashboard,
  },
  {
    id: "tickets",
    label: "Ticket Management",
    description: "Search, assign, and manage support tickets",
    icon: TicketCheck,
  },
  {
    id: "users",
    label: "User Management",
    description: "Manage employee and service desk accounts",
    icon: Users,
  },
  {
    id: "automation",
    label: "Automation Workflows",
    description: "Configure routing, SLA, and lifecycle rules",
    icon: Bot,
    accent: "ai",
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Review assignments, updates, and alerts",
    icon: Bell,
  },
  {
    id: "reports",
    label: "Reports & Analytics",
    description: "Monitor workloads and operational trends",
    icon: BarChart3,
  },
  {
    id: "settings",
    label: "Settings",
    description: "Application preferences and integrations",
    icon: Settings,
  },
];

export function getNavigationItem(pageId: PageId): NavigationItem {
  return navigationItems.find((item) => item.id === pageId) ?? navigationItems[0];
}

