import type { LucideIcon } from "lucide-react";

export type PageId =
  | "dashboard"
  | "tickets"
  | "users"
  | "automation"
  | "notifications"
  | "reports"
  | "settings";

export interface NavigationItem {
  id: PageId;
  label: string;
  description: string;
  icon: LucideIcon;
  accent?: "ai";
}

