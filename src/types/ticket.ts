export type TicketStatus =
  | "Open"
  | "Assigned"
  | "In Progress"
  | "Pending"
  | "Resolved"
  | "Closed";

export type TicketPriority = "Low" | "Medium" | "High" | "Critical";

export interface Ticket {
  id: string;
  subject: string;
  requester: string;
  priority: TicketPriority;
  status: TicketStatus;
  updatedAt: string;
}

