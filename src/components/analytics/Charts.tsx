import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Sector } from "recharts";
import { monthlyExpenses, categoryMeta, type Category } from "@/data/mockData";
import { useGarageData } from "@/context/garage-data";
import { useSettings } from "@/context/settings";
import { memo, useMemo, useState, useCallback } from "react";

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} stroke="hsl(var(--card))" strokeWidth={3} style={{ filter: "drop-shadow(0 6px 14px hsl(var(--foreground) / 0.18))", transition: "all 200ms cubic-bezier(0.2,0.8,0.2,1)" }} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 12} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.35} />
    </g>
  );
};

export const CategoryPie = memo(function CategoryPie() {
  const { receipts } = useGarageData();
  const { symbol, currency } = useSettings();
  const fmt = useCallback((v: number) => currency === "PLN" ? `${v.toFixed(2)} ${symbol}` : `${symbol}${v.toFixed(2)}`, [symbol, currency]);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const data = useMemo(() => {
    const totals: Record<Category, number> = { fuel: 0, parts: 0, service: 0, insurance: 0, other: 0 };
    receipts.forEach((r) => { totals[r.category] += r.amount; });
    return (Object.keys(totals) as Category[]).map((k) => ({
      name: categoryMeta[k].label, value: +totals[k].toFixed(2), color: categoryMeta[k].color, key: k,
    }));
  }, [receipts]);

  return (
    <div className="surface-card p-6 animate-scale-in">
      <h3 className="font-display text-lg font-semibold">Expense distribution</h3>
      <p className="text-sm text-muted-foreground mb-4">By category, all-time</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              stroke="hsl(var(--card))"
              strokeWidth={3}
              isAnimationActive
              animationBegin={120}
              animationDuration={1200}
              animationEasing="ease-out"
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              {data.map((d) => <Cell key={d.key} fill={d.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              formatter={(v: number) => [fmt(v), ""]}
            />
            <Legend iconType="circle" formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export const MonthlyBars = memo(function MonthlyBars() {
  const { symbol, currency } = useSettings();
  const fmt = useCallback((v: number) => currency === "PLN" ? `${v.toFixed(2)} ${symbol}` : `${symbol}${v.toFixed(2)}`, [symbol, currency]);
  const [activeBar, setActiveBar] = useState<number | undefined>(undefined);
  return (
    <div className="surface-card p-6 animate-fade-in">
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
              <linearGradient id="barFillActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" />
                <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "hsl(var(--secondary) / 0.6)" }}
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              formatter={(v: number) => [fmt(v), "Spent"]}
            />
            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
              maxBarSize={48}
              isAnimationActive
              animationBegin={180}
              animationDuration={1200}
              animationEasing="ease-out"
              onMouseEnter={(_, i) => setActiveBar(i)}
              onMouseLeave={() => setActiveBar(undefined)}
            >
              {monthlyExpenses.map((_, i) => (
                <Cell
                  key={i}
                  fill={activeBar === i ? "url(#barFillActive)" : "url(#barFill)"}
                  style={{ transition: "all 220ms cubic-bezier(0.2,0.8,0.2,1)", filter: activeBar === i ? "drop-shadow(0 8px 16px hsl(var(--primary) / 0.35))" : "none" }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
