import { CheckCircle2, CircleDot, Clock3, TicketCheck } from "lucide-react";
import { RecentTickets } from "@/components/dashboard/RecentTickets";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { filterTickets, recentTickets } from "@/data/tickets";
import { roleLabels, type Profile } from "@/types/auth";

interface DashboardPageProps {
  searchQuery: string;
  profile: Profile;
}

export function DashboardPage({ searchQuery, profile }: DashboardPageProps) {
  const filteredTickets = filterTickets(recentTickets, searchQuery);

  return (
    <main className="h-full overflow-y-auto bg-background p-6" aria-labelledby="dashboard-heading">
      <div className="mx-auto max-w-[1440px]">
        <section className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="dashboard-heading" className="text-[22px] font-bold tracking-tight">
              Good day, {profile.full_name.split(" ")[0] || "there"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Here&apos;s what is happening in your {roleLabels[profile.role]} workspace today.
            </p>
          </div>
          <Badge
            variant="outline"
            className="gap-1.5 rounded-full border-emerald-200 bg-emerald-50 px-2.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
          >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Mock data active
          </Badge>
        </section>

        <section className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Ticket statistics">
          <StatCard
            label="Total Tickets"
            value={128}
            detail="8% from last week"
            icon={TicketCheck}
            accent="blue"
            trend="up"
          />
          <StatCard
            label="Open Tickets"
            value={24}
            detail="5 awaiting assignment"
            icon={CircleDot}
            accent="sky"
          />
          <StatCard
            label="In Progress"
            value={16}
            detail="Across 5 technicians"
            icon={Clock3}
            accent="violet"
          />
          <StatCard
            label="Resolved Tickets"
            value={88}
            detail="12% resolution increase"
            icon={CheckCircle2}
            accent="green"
            trend="up"
          />
        </section>

        <RecentTickets tickets={filteredTickets} isFiltered={searchQuery.trim().length > 0} />
      </div>
    </main>
  );
}

