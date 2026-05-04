import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "./Vehicles";
import { CategoryPie, MonthlyBars } from "@/components/analytics/Charts";
import { receipts, categoryMeta, type Category } from "@/data/mockData";
import { TrendingUp, Wallet, Award } from "lucide-react";
import { useMemo } from "react";

export default function Analytics() {
  const { total, top, avg } = useMemo(() => {
    const totals: Record<Category, number> = { fuel: 0, parts: 0, service: 0, insurance: 0, other: 0 };
    receipts.forEach((r) => { totals[r.category] += r.amount; });
    const total = receipts.reduce((s, r) => s + r.amount, 0);
    const top = (Object.entries(totals) as [Category, number][]).sort((a, b) => b[1] - a[1])[0];
    return { total, top, avg: total / receipts.length };
  }, []);

  const TopIcon = categoryMeta[top[0]].icon;

  return (
    <AppShell>
      <PageHeader title="Analytics" subtitle="Understand where your money goes" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 mb-6">
        <SummaryCard icon={Wallet} label="Total spend" value={`$${total.toFixed(2)}`} hint={`${receipts.length} receipts`} tone="primary" />
        <SummaryCard
          icon={TopIcon}
          label="Top category"
          value={categoryMeta[top[0]].label}
          hint={`$${top[1].toFixed(2)} spent`}
          tone="accent"
        />
        <SummaryCard icon={Award} label="Avg. receipt" value={`$${avg.toFixed(2)}`} hint="Across all categories" tone="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CategoryPie />
        <MonthlyBars />
      </div>
    </AppShell>
  );
}

function SummaryCard({ icon: Icon, label, value, hint, tone }: any) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent:  "bg-accent/15 text-accent-foreground",
    success: "bg-success/10 text-success",
  };
  return (
    <div className="surface-card p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl grid place-items-center ${tones[tone]}`}><Icon className="h-6 w-6" /></div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}
