import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Sector } from "recharts";
import { categoryMeta, type Category, type Receipt } from "@/data/mockData";
import { useGarageData } from "@/context/garage-data";
import { useSettings } from "@/context/settings";
import { memo, useMemo, useState, useCallback } from "react";
import { format, isSameMonth, parseISO, subMonths } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ActiveShapeProps = {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
};

const renderActiveShape = ({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill }: ActiveShapeProps) => {
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} stroke="hsl(var(--card))" strokeWidth={3} style={{ filter: "drop-shadow(0 6px 14px hsl(var(--foreground) / 0.18))", transition: "all 200ms cubic-bezier(0.2,0.8,0.2,1)" }} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 12} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.35} />
    </g>
  );
};

export const CategoryPie = memo(function CategoryPie({ receipts: externalReceipts }: { receipts?: Receipt[] }) {
  const { receipts } = useGarageData();
  const sourceReceipts = externalReceipts ?? receipts;
  const { symbol, currency } = useSettings();
  const fmt = useCallback((v: number) => currency === "PLN" ? `${v.toFixed(2)} ${symbol}` : `${symbol}${v.toFixed(2)}`, [symbol, currency]);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const data = useMemo(() => {
    const totals: Record<Category, number> = { fuel: 0, parts: 0, service: 0, insurance: 0, other: 0 };
    sourceReceipts.forEach((r) => { totals[r.category] += r.amount; });
    return (Object.keys(totals) as Category[]).map((k) => ({
      name: categoryMeta[k].label, value: +totals[k].toFixed(2), color: categoryMeta[k].color, key: k,
    }));
  }, [sourceReceipts]);

  return (
    <div className="surface-card p-6 animate-scale-in">
      <h3 className="font-display text-lg font-semibold">Expense distribution</h3>
      <p className="text-sm text-muted-foreground mb-4">By category, all-time</p>
      <div className="h-[280px] chart-pie-enter">
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
              labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              itemStyle={{ color: "hsl(var(--popover-foreground))" }}
              formatter={(v: number) => [fmt(v), ""]}
            />
            <Legend iconType="circle" formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export const MonthlyBars = memo(function MonthlyBars({ receipts: externalReceipts }: { receipts?: Receipt[] }) {
  const { receipts } = useGarageData();
  const sourceReceipts = externalReceipts ?? receipts;
  const { symbol, currency } = useSettings();
  const fmt = useCallback((v: number) => currency === "PLN" ? `${v.toFixed(2)} ${symbol}` : `${symbol}${v.toFixed(2)}`, [symbol, currency]);
  const [activeBar, setActiveBar] = useState<number | undefined>(undefined);
  const [rangeMode, setRangeMode] = useState<"all_months" | "last_12" | "yearly">("all_months");

  const monthlyData = useMemo(() => {
    const parsedReceipts = sourceReceipts
      .map((receipt) => {
        try {
          return { ...receipt, parsedDate: parseISO(receipt.date) };
        } catch {
          return null;
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstMonthWithData = parsedReceipts.length
      ? parsedReceipts.reduce((min, item) => (item.parsedDate < min ? item.parsedDate : min), parsedReceipts[0].parsedDate)
      : currentMonth;
    const firstMonthStart = new Date(firstMonthWithData.getFullYear(), firstMonthWithData.getMonth(), 1);

    if (rangeMode === "yearly") {
      const firstYear = firstMonthStart.getFullYear();
      const currentYear = currentMonth.getFullYear();
      const years = Array.from({ length: currentYear - firstYear + 1 }, (_, idx) => firstYear + idx);
      return years.map((year) => {
        const value = parsedReceipts
          .filter((item) => item.parsedDate.getFullYear() === year)
          .reduce((sum, item) => sum + item.amount, 0);
        return { month: String(year), value: Number(value.toFixed(2)) };
      });
    }

    let sequenceStart = firstMonthStart;
    if (rangeMode === "last_12") {
      sequenceStart = subMonths(currentMonth, 11);
    }

    const months: Date[] = [];
    let cursor = new Date(sequenceStart.getFullYear(), sequenceStart.getMonth(), 1);
    while (cursor <= currentMonth) {
      months.push(new Date(cursor));
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }

    return months.map((monthDate) => {
      const value = parsedReceipts
        .filter((item) => isSameMonth(item.parsedDate, monthDate))
        .reduce((sum, item) => sum + item.amount, 0);
      return {
        month: format(monthDate, "MMM yy"),
        value: Number(value.toFixed(2)),
      };
    });
  }, [rangeMode, sourceReceipts]);
  return (
    <div className="surface-card p-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display text-lg font-semibold">Expenses timeline</h3>
          <p className="text-sm text-muted-foreground">
            {rangeMode === "yearly"
              ? "Grouped by year"
              : rangeMode === "last_12"
                ? "Last 12 months"
                : "From first registered month"}
          </p>
        </div>
        <Select value={rangeMode} onValueChange={(value) => setRangeMode(value as "all_months" | "last_12" | "yearly")}>
          <SelectTrigger className="w-[210px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_months">All months (from start)</SelectItem>
            <SelectItem value="last_12">Last 12 months</SelectItem>
            <SelectItem value="yearly">Yearly view</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
              labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              itemStyle={{ color: "hsl(var(--popover-foreground))" }}
              formatter={(v: number) => [fmt(v), "Spent"]}
            />
            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
              maxBarSize={48}
              isAnimationActive={false}
              onMouseEnter={(_, i) => setActiveBar(i)}
              onMouseLeave={() => setActiveBar(undefined)}
            >
              {monthlyData.map((_, i) => (
                <Cell
                  key={i}
                  fill={activeBar === i ? "url(#barFillActive)" : "url(#barFill)"}
                  style={{
                    transition: "fill 180ms cubic-bezier(0.2,0.8,0.2,1), filter 180ms cubic-bezier(0.2,0.8,0.2,1)",
                    filter: activeBar === i ? "drop-shadow(0 3px 8px hsl(var(--primary) / 0.25))" : "none",
                    transformBox: "fill-box",
                    transformOrigin: "center bottom",
                    animation: `chart-bar-rise 620ms cubic-bezier(0.22,0.8,0.2,1) ${120 + i * 80}ms both`,
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
