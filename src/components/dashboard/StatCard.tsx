import { type LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  delta?: { value: string; positive?: boolean };
  icon: LucideIcon;
  tone?: "primary" | "accent" | "success" | "warning";
  hint?: string;
};

const toneStyles: Record<NonNullable<Props["tone"]>, string> = {
  primary: "from-primary/15 to-primary/0 text-primary",
  accent:  "from-accent/20 to-accent/0 text-accent-foreground",
  success: "from-success/15 to-success/0 text-success",
  warning: "from-warning/20 to-warning/0 text-warning",
};

export function StatCard({ label, value, delta, icon: Icon, tone = "primary", hint }: Props) {
  return (
    <div className="surface-card p-5 relative overflow-hidden group">
      <div className={cn("absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-to-br opacity-80 blur-2xl pointer-events-none", toneStyles[tone])} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("h-11 w-11 rounded-xl grid place-items-center bg-card shadow-elev-sm border border-border/60 transition-transform group-hover:-rotate-6", toneStyles[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {delta && (
        <div className="relative mt-4 flex items-center gap-1.5 text-xs font-medium">
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5",
            delta.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
            {delta.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta.value}
          </span>
          <span className="text-muted-foreground">vs. last month</span>
        </div>
      )}
    </div>
  );
}
