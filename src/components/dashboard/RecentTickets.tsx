import { Inbox, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import type { Ticket, TicketPriority } from "@/types/ticket";

const priorityStyles: Record<TicketPriority, string> = {
  Low: "bg-slate-400",
  Medium: "bg-sky-500",
  High: "bg-amber-500",
  Critical: "bg-red-500",
};

interface RecentTicketsProps {
  tickets: Ticket[];
  isFiltered: boolean;
}

export function RecentTickets({ tickets, isFiltered }: RecentTicketsProps) {
  return (
    <Card className="overflow-hidden rounded-xl border bg-card py-0 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <CardHeader className="flex-row items-center justify-between gap-4 border-b px-5 py-4">
        <div>
          <h2 className="text-sm font-bold">Recent Tickets</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Latest service desk activity requiring attention
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full px-2.5 text-[10px] font-bold">
          {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        {tickets.length === 0 ? (
          <div className="flex min-h-[264px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              {isFiltered ? <SearchX className="size-5" /> : <Inbox className="size-5" />}
            </div>
            <p className="text-sm font-semibold">
              {isFiltered ? "No matching tickets" : "No recent tickets"}
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              {isFiltered
                ? "Try a ticket number, requester, priority, or status."
                : "New ticket activity will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left">
              <thead>
                <tr className="h-10 border-b bg-muted/40 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="w-[105px] px-5">Ticket</th>
                  <th className="px-3">Subject</th>
                  <th className="w-[142px] px-3">Requester</th>
                  <th className="w-[100px] px-3">Priority</th>
                  <th className="w-[122px] px-3">Status</th>
                  <th className="w-[94px] px-3 pr-5">Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="h-[52px] border-b last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-5 text-xs font-bold text-primary">{ticket.id}</td>
                    <td className="max-w-[340px] truncate px-3 text-xs font-medium">
                      {ticket.subject}
                    </td>
                    <td className="px-3 text-xs text-muted-foreground">{ticket.requester}</td>
                    <td className="px-3">
                      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <span
                          className={cn("size-1.5 rounded-full", priorityStyles[ticket.priority])}
                          aria-hidden="true"
                        />
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-3 pr-5 text-[11px] text-muted-foreground">{ticket.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

