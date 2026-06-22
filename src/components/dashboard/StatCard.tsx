import { type LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { CountUp } from "@/components/ui/count-up";

type Props = {
  label: string;
  value: string | number;
  /** When value is a number, format with these */
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delta?: { value: string; positive?: boolean };
  deltaLabel?: string;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "success" | "warning";
  hint?: string;
};

const toneStyles: Record<NonNullable<Props["tone"]>, string> = {
  primary: "from-primary/15 to-primary/0 text-primary",
  accent:  "from-accent/20 to-accent/0 text-accent",
  success: "from-success/15 to-success/0 text-success",
  warning: "from-warning/20 to-warning/0 text-warning",
};

export const StatCard = memo(function StatCard({ label, value, prefix, suffix, decimals = 0, delta, deltaLabel = "vs. last month", icon: Icon, tone = "primary", hint }: Props) {
  return (
    <div className="surface-card p-5 relative overflow-hidden group transition-transform duration-200 hover:-translate-y-0.5 will-change-transform">
      <div className={cn("absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-to-br opacity-80 blur-2xl pointer-events-none transition-transform duration-500 group-hover:scale-110", toneStyles[tone])} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight tabular-nums">
            {typeof value === "number" ? (
              <CountUp value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
            ) : value}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("h-11 w-11 rounded-xl grid place-items-center bg-card shadow-elev-sm border border-border/60 transition-all duration-300 group-hover:-rotate-6 group-hover:scale-110", toneStyles[tone])}>
          <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>
      {delta && (
        <div className="relative mt-4 flex items-center gap-1.5 text-xs font-medium">
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5",
            delta.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
            {delta.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta.value}
          </span>
          <span className="text-muted-foreground">{deltaLabel}</span>
        </div>
      )}
    </div>
  );
});
