import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/types/auth";

export type PageId =
  | "dashboard"
  | "my-tickets"
  | "create-ticket"
  | "assigned-tickets"
  | "tickets"
  | "users"
  | "administrators"
  | "system"
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
  roles: UserRole[];
}

