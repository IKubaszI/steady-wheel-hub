import { Car, Gauge, Calendar, ChevronRight, Palette } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Vehicle } from "@/data/mockData";

export function VehicleCard({ v }: { v: Vehicle }) {
  return (
    <article className="surface-card p-6 group cursor-pointer relative overflow-hidden">
      <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-gradient-primary opacity-[0.08] blur-3xl group-hover:opacity-20 transition-opacity" />
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-glow">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{v.year}</p>
            <h3 className="font-display text-lg font-semibold leading-tight">{v.brand}</h3>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-1 rounded-md bg-secondary text-secondary-foreground">{v.plate}</span>
      </div>

      <p className="relative mt-4 text-sm text-muted-foreground">{v.model}</p>

      <dl className="relative mt-5 grid grid-cols-3 gap-3 text-sm">
        <Stat icon={Gauge} label="Mileage" value={`${(v.mileage/1000).toFixed(1)}k mi`} />
        <Stat icon={Calendar} label="Next svc" value={format(parseISO(v.nextService), "MMM d")} />
        <Stat icon={Palette} label="Color" value={v.color.split(" ")[0]} />
      </dl>

      <button className="relative mt-5 w-full inline-flex items-center justify-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
        View details <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
    </article>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-lg bg-secondary/60 p-2.5">
      <div className="flex items-center gap-1 text-muted-foreground"><Icon className="h-3 w-3" /><dt className="text-[10px] uppercase tracking-wider">{label}</dt></div>
      <dd className="font-semibold text-foreground text-sm mt-0.5 truncate">{value}</dd>
    </div>
  );
}
