import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { receipts, monthlyExpenses, categoryMeta, type Category } from "@/data/mockData";
import { useMemo } from "react";

export function CategoryPie() {
  const data = useMemo(() => {
    const totals: Record<Category, number> = { fuel: 0, parts: 0, service: 0, insurance: 0, other: 0 };
    receipts.forEach((r) => { totals[r.category] += r.amount; });
    return (Object.keys(totals) as Category[]).map((k) => ({
      name: categoryMeta[k].label, value: +totals[k].toFixed(2), color: categoryMeta[k].color, key: k,
    }));
  }, []);

  return (
    <div className="surface-card p-6">
      <h3 className="font-display text-lg font-semibold">Expense distribution</h3>
      <p className="text-sm text-muted-foreground mb-4">By category, all-time</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} stroke="hsl(var(--card))" strokeWidth={3}>
              {data.map((d) => <Cell key={d.key} fill={d.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              formatter={(v: number) => [`$${v.toFixed(2)}`, ""]}
            />
            <Legend iconType="circle" formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function MonthlyBars() {
  return (
    <div className="surface-card p-6">
      <h3 className="font-display text-lg font-semibold">Monthly expenses</h3>
      <p className="text-sm text-muted-foreground mb-4">Last 7 months</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyExpenses} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "hsl(var(--secondary))" }}
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              formatter={(v: number) => [`$${v.toFixed(2)}`, "Spent"]}
            />
            <Bar dataKey="value" fill="url(#barFill)" radius={[8, 8, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
