import { Car, Gauge, Calendar, ChevronRight, Palette } from "lucide-react";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import type { Vehicle } from "@/data/mockData";
import { VehicleDetailsDialog } from "./VehicleDetailsDialog";
import { findBrandLogo } from "@/lib/car-brands";
import { getPattern, getTheme } from "@/lib/vehicle-themes";
import { cn } from "@/lib/utils";

export function VehicleCard({ v }: { v: Vehicle }) {
  const [open, setOpen] = useState(false);
  const logoSrc = v.logoUrl ?? findBrandLogo(v.brand);
  const theme = getTheme(v.theme);
  const pattern = getPattern(v.pattern);
  const themed = !!theme.cardClass;
  return (
    <>
    <article
      className={cn(
        "surface-card p-6 group cursor-pointer relative overflow-hidden hover:-translate-y-1 hover:shadow-elev-lg transition-all duration-300",
        theme.cardClass
      )}
      onClick={() => setOpen(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); } }}
    >
      {pattern.style && (
        <div className="pointer-events-none absolute inset-0" style={pattern.style} aria-hidden />
      )}
      {v.image ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"
          style={{ backgroundImage: `url(${v.image})`, filter: "blur(10px) saturate(1.05)" }}
          aria-hidden
        />
      ) : !themed ? (
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-gradient-primary opacity-[0.08] blur-3xl group-hover:opacity-20 transition-opacity" />
      ) : null}
      {v.image && <div className="absolute inset-0 bg-gradient-to-br from-card/80 via-card/70 to-card/90" aria-hidden />}
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-card grid place-items-center text-primary shadow-elev-sm border border-border overflow-hidden">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={`${v.brand} logo`}
                className="h-9 w-9 object-contain"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.style.display = "none";
                  const next = img.nextElementSibling as HTMLElement | null;
                  if (next) next.style.display = "grid";
                }}
              />
            ) : null}
            <Car
              className="h-6 w-6"
              style={{ display: logoSrc ? "none" : undefined }}
            />
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

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="relative mt-5 w-full inline-flex items-center justify-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md py-1"
      >
        View details <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
    </article>
    <VehicleDetailsDialog vehicle={v} open={open} onOpenChange={setOpen} />
    </>
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
