import { Car, Gauge, Calendar, ChevronRight, Palette } from "lucide-react";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import type { Vehicle } from "@/data/mockData";
import { VehicleDetailsDialog } from "./VehicleDetailsDialog";
import { findBrandLogo } from "@/lib/car-brands";
import { getPattern, getTheme } from "@/lib/vehicle-themes";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { useSettings } from "@/context/settings";
import { pl, enUS } from "date-fns/locale";

export function VehicleCard({ v }: { v: Vehicle }) {
  const [open, setOpen] = useState(false);
  const logoSrc = v.logoUrl ?? findBrandLogo(v.brand);
  const theme = getTheme(v.theme);
  const pattern = getPattern(v.pattern);
  const themed = !!theme.cardClass;
  const { t, distanceUnit, language } = useSettings();
  const dateLocale = language === "pl" ? pl : enUS;

  const getMileageString = (mileage: number) => {
    const isMetric = distanceUnit === "km";
    const factor = isMetric ? 1.609344 : 1;
    const value = (mileage * factor) / 1000;
    const suffix = isMetric ? "km" : "mi";
    const formatted = value.toLocaleString(language === "pl" ? "pl-PL" : "en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${formatted}k ${suffix}`;
  };

  const translatedColor = t(`color.${v.color.toLowerCase()}` as any) || v.color;

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
        <Stat icon={Gauge} label={t("vehicles.mileageLabel")} value={getMileageString(v.mileage)} />
        <Stat icon={Calendar} label={t("vehicles.nextSvcLabel")} value={format(parseISO(v.nextService), "MMM d", { locale: dateLocale })} />
        <Stat icon={Palette} label={t("vehicles.colorLabel")} value={translatedColor.split(" ")[0]} />
      </dl>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="relative mt-5 w-full inline-flex items-center justify-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md py-1"
      >
        {t("vehicles.viewDetails")} <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
    </article>
    <VehicleDetailsDialog vehicle={v} open={open} onOpenChange={setOpen} />
    </>
  );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 p-2.5">
      <div className="flex items-center gap-1 text-muted-foreground"><Icon className="h-3 w-3" /><dt className="text-[10px] uppercase tracking-wider">{label}</dt></div>
      <dd className="font-semibold text-foreground text-sm mt-0.5 truncate">{value}</dd>
    </div>
  );
}
