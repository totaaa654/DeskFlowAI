import type { Ticket } from "@/types/ticket";

export const recentTickets: Ticket[] = [
  {
    id: "DF-1048",
    subject: "Unable to connect to company VPN",
    requester: "Maya Santos",
    priority: "High",
    status: "In Progress",
    updatedAt: "8 min ago",
  },
  {
    id: "DF-1047",
    subject: "New starter account access",
    requester: "Liam Cruz",
    priority: "Medium",
    status: "Assigned",
    updatedAt: "24 min ago",
  },
  {
    id: "DF-1046",
    subject: "Printer queue not responding",
    requester: "Ava Reyes",
    priority: "Low",
    status: "Pending",
    updatedAt: "1 hr ago",
  },
  {
    id: "DF-1045",
    subject: "Microsoft 365 sign-in issue",
    requester: "Noah Garcia",
    priority: "High",
    status: "Open",
    updatedAt: "2 hrs ago",
  },
  {
    id: "DF-1044",
    subject: "Request for shared drive access",
    requester: "Ella Mendoza",
    priority: "Medium",
    status: "Resolved",
    updatedAt: "3 hrs ago",
  },
  {
    id: "DF-1043",
    subject: "Laptop docking station display",
    requester: "Ethan Flores",
    priority: "Medium",
    status: "Closed",
    updatedAt: "Yesterday",
  },
];

export function filterTickets(tickets: Ticket[], query: string): Ticket[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return tickets;

  return tickets.filter((ticket) =>
    [ticket.id, ticket.subject, ticket.requester, ticket.priority, ticket.status].some(
      (value) => value.toLocaleLowerCase().includes(normalized),
    ),
  );
}

