import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { monthlyExpenses, categoryMeta, type Category } from "@/data/mockData";
import { useGarageData } from "@/context/garage-data";
import { useMemo } from "react";

function GlassTooltip({ active, payload, label, valuePrefix = "$" }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-popover/80 backdrop-blur-md px-3 py-2 shadow-elev-lg text-xs">
      {label && <p className="font-semibold text-foreground/90 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.color }} />
          <span>{p.name}</span>
          <span className="ml-auto font-semibold text-foreground tabular-nums">{valuePrefix}{Number(p.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

export function CategoryPie() {
  const { receipts } = useGarageData();
  const data = useMemo(() => {
    const totals: Record<Category, number> = { fuel: 0, parts: 0, service: 0, insurance: 0, other: 0 };
    receipts.forEach((r) => { totals[r.category] += r.amount; });
    return (Object.keys(totals) as Category[]).map((k) => ({
      name: categoryMeta[k].label, value: +totals[k].toFixed(2), color: categoryMeta[k].color, key: k,
    }));
  }, []);

  return (
    <div className="glass-card p-7 animate-scale-in">
      <h3 className="font-display text-lg font-semibold">Expense distribution</h3>
      <p className="text-sm text-muted-foreground mb-4">By category, all-time</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} stroke="hsl(var(--card))" strokeWidth={3} isAnimationActive animationBegin={150} animationDuration={1100} animationEasing="ease-out">
              {data.map((d) => <Cell key={d.key} fill={d.color} />)}
            </Pie>
            <Tooltip content={<GlassTooltip />} />
            <Legend iconType="circle" formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function MonthlyBars() {
  return (
    <div className="glass-card p-7 animate-fade-in">
      <h3 className="font-display text-lg font-semibold">Monthly expenses</h3>
      <p className="text-sm text-muted-foreground mb-4">Last 7 months</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyExpenses} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
                <stop offset="100%" stopColor="hsl(var(--primary-glow))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip content={<GlassTooltip />} cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.2, strokeWidth: 32 }} />
            <Area type="monotone" dataKey="value" name="Spent" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#areaFill)" isAnimationActive animationBegin={150} animationDuration={1100} animationEasing="ease-out" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
