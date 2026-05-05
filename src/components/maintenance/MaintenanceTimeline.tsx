import { type ServiceStatus } from "@/data/mockData";
import { useGarageData } from "@/context/garage-data";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Clock, AlertTriangle, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const statusMap: Record<ServiceStatus, { label: string; cls: string; icon: any }> = {
  completed: { label: "Completed", cls: "bg-success/10 text-success border-success/30", icon: CheckCircle2 },
  upcoming:  { label: "Upcoming",  cls: "bg-primary/10 text-primary border-primary/30",  icon: Clock },
  overdue:   { label: "Overdue",   cls: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertTriangle },
};

type Props = {
  status?: ServiceStatus | "all";
};

export function MaintenanceTimeline({ status = "all" }: Props) {
  const { maintenance, vehicles } = useGarageData();
  const sorted = [...maintenance]
    .filter((entry) => status === "all" || entry.status === status)
    .sort((a, b) => +parseISO(b.date) - +parseISO(a.date));
  return (
    <ol className="relative border-l-2 border-dashed border-border ml-4 space-y-6">
      {sorted.map((m) => {
        const v = vehicles.find((x) => x.id === m.vehicleId)!;
        const s = statusMap[m.status];
        const SIcon = s.icon;
        return (
          <li key={m.id} className="ml-6 relative">
            <span className="absolute -left-[34px] top-1 h-7 w-7 rounded-full bg-card border-2 border-border grid place-items-center shadow-elev-sm">
              <Wrench className="h-3.5 w-3.5 text-primary" />
            </span>
            <div className="surface-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display text-base font-semibold">{m.type}</h4>
                    <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border", s.cls)}>
                      <SIcon className="h-3 w-3" /> {s.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {v.brand} {v.model} · {format(parseISO(m.date), "MMMM d, yyyy")}
                  </p>
                </div>
                <p className="font-display text-lg font-bold tabular-nums">${m.cost.toFixed(2)}</p>
              </div>
              <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{m.notes}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
