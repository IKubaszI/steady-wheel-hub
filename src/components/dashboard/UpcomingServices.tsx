import { maintenance, vehicles } from "@/data/mockData";
import { format, parseISO, differenceInDays } from "date-fns";
import { CalendarClock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function UpcomingServices() {
  const items = maintenance
    .filter((m) => m.status !== "completed")
    .sort((a, b) => +parseISO(a.date) - +parseISO(b.date));

  return (
    <div className="surface-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display text-lg font-semibold">Upcoming services</h3>
          <p className="text-sm text-muted-foreground">Don't miss your next appointment</p>
        </div>
        <CalendarClock className="h-5 w-5 text-muted-foreground" />
      </div>
      <ul className="space-y-3">
        {items.map((m) => {
          const v = vehicles.find((x) => x.id === m.vehicleId)!;
          const days = differenceInDays(parseISO(m.date), new Date());
          const overdue = m.status === "overdue";
          return (
            <li key={m.id} className={cn(
              "flex items-center gap-4 p-3 rounded-xl border transition-all",
              overdue ? "border-destructive/30 bg-destructive/5" : "border-border/60 hover:border-primary/40 hover:bg-primary/5"
            )}>
              <div className={cn(
                "h-12 w-12 rounded-xl grid place-items-center font-display font-bold text-sm",
                overdue ? "bg-destructive text-destructive-foreground" : "bg-primary/10 text-primary"
              )}>
                {format(parseISO(m.date), "dd")}
                <span className="sr-only">{format(parseISO(m.date), "MMMM yyyy")}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{m.type}</p>
                <p className="text-xs text-muted-foreground truncate">{v.brand} {v.model} · {v.plate}</p>
              </div>
              <div className="text-right">
                {overdue ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                    <AlertTriangle className="h-3 w-3" /> Overdue
                  </span>
                ) : (
                  <span className="text-xs font-medium text-primary">in {days}d</span>
                )}
                <p className="text-[11px] text-muted-foreground tabular-nums">${m.cost.toFixed(0)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
