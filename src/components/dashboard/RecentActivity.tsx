import { maintenance, receipts, vehicles, categoryMeta } from "@/data/mockData";
import { format, parseISO } from "date-fns";
import { Wrench } from "lucide-react";

const vehicleName = (id: string) => {
  const v = vehicles.find((x) => x.id === id);
  return v ? `${v.brand} ${v.model}` : "Unknown";
};

export function RecentActivity() {
  const items = [
    ...maintenance.slice(0, 3).map((m) => ({
      kind: "service" as const,
      id: m.id, title: m.type, sub: vehicleName(m.vehicleId), date: m.date, amount: m.cost,
    })),
    ...receipts.slice(0, 3).map((r) => ({
      kind: "receipt" as const,
      id: r.id, title: r.vendor, sub: vehicleName(r.vehicleId), date: r.date, amount: r.amount, category: r.category,
    })),
  ].sort((a, b) => +parseISO(b.date) - +parseISO(a.date));

  return (
    <div className="surface-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display text-lg font-semibold">Recent activity</h3>
          <p className="text-sm text-muted-foreground">Latest services and receipts</p>
        </div>
      </div>
      <ul className="divide-y divide-border/60">
        {items.map((it) => {
          const Icon = it.kind === "receipt" ? categoryMeta[it.category!].icon : Wrench;
          const tone = it.kind === "receipt" ? categoryMeta[it.category!].bg : "bg-primary/10 text-primary";
          return (
            <li key={`${it.kind}-${it.id}`} className="flex items-center gap-4 py-3 group">
              <div className={`h-10 w-10 rounded-xl grid place-items-center ${tone} transition-transform group-hover:scale-105`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{it.title}</p>
                <p className="text-xs text-muted-foreground truncate">{it.sub} · {format(parseISO(it.date), "MMM d, yyyy")}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold tabular-nums">${it.amount.toFixed(2)}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{it.kind}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
