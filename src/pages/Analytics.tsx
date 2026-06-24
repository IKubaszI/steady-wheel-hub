import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "./Vehicles";
import { CategoryPie, MonthlyBars } from "@/components/analytics/Charts";
import { categoryMeta, type Category, type Receipt } from "@/data/mockData";
import { Wallet, Award, Plus } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { useGarageData } from "@/context/garage-data";
import { useSettings } from "@/context/settings";
import { CountUp } from "@/components/ui/count-up";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Lazy-load AddReceiptForm so that react-hook-form + tesseract.js are NOT
// bundled into the Analytics chunk — they are fetched only when the dialog opens.
const AddReceiptForm = lazy(() => import("@/components/forms/AddReceiptForm").then(m => ({ default: m.AddReceiptForm })));

export default function Analytics() {
  const { receipts, vehicles } = useGarageData();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("all");
  const { symbol, currency, t } = useSettings();
  const [open, setOpen] = useState(false);
  const moneyPrefix = currency === "PLN" ? "" : symbol;
  const moneySuffix = currency === "PLN" ? ` ${symbol}` : "";
  const filteredReceipts = useMemo<Receipt[]>(
    () => (selectedVehicleId === "all" ? receipts : receipts.filter((receipt) => receipt.vehicleId === selectedVehicleId)),
    [receipts, selectedVehicleId]
  );
  const { total, top, avg } = useMemo(() => {
    const totals: Record<Category, number> = { fuel: 0, parts: 0, service: 0, insurance: 0, other: 0 };
    filteredReceipts.forEach((r) => { totals[r.category] += r.amount; });
    const total = filteredReceipts.reduce((s, r) => s + r.amount, 0);
    const top = (Object.entries(totals) as [Category, number][]).sort((a, b) => b[1] - a[1])[0];
    return { total, top, avg: filteredReceipts.length ? total / filteredReceipts.length : 0 };
  }, [filteredReceipts]);

  const TopIcon = categoryMeta[top[0]].icon;

  return (
    <AppShell onQuickAdd={() => setOpen(true)}>
      <PageHeader
        title={t("analytics.title")}
        subtitle={t("analytics.subtitle")}
        action={
          <Button onClick={() => setOpen(true)} className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
            <Plus className="h-4 w-4" /> {t("dashboard.addReceipt")}
          </Button>
        }
      />
      <div className="mb-6 flex items-center justify-end">
        <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
          <SelectTrigger className="w-full max-w-sm">
            <SelectValue placeholder="Filter by vehicle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All vehicles</SelectItem>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.brand} {vehicle.model} · {vehicle.plate}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 mb-6">
        <div className="animate-fade-in" style={{ animationFillMode: "backwards" }}>
          <SummaryCard icon={Wallet} label="Total spend" value={<CountUp value={total} prefix={moneyPrefix} suffix={moneySuffix} decimals={2} />} hint={`${filteredReceipts.length} receipts`} tone="primary" />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "backwards" }}>
          <SummaryCard
            icon={TopIcon}
            label="Top category"
            value={categoryMeta[top[0]].label}
            hint={`${moneyPrefix}${top[1].toFixed(2)}${moneySuffix} spent`}
            tone="accent"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "backwards" }}>
          <SummaryCard icon={Award} label="Avg. receipt" value={<CountUp value={avg} prefix={moneyPrefix} suffix={moneySuffix} decimals={2} />} hint="Across all categories" tone="violet" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "backwards" }}>
          <CategoryPie receipts={filteredReceipts} />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "backwards" }}>
          <MonthlyBars receipts={filteredReceipts} />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{t("form.receipt.addTitle")}</DialogTitle>
            <DialogDescription>{t("form.receipt.addDesc")}</DialogDescription>
          </DialogHeader>
          {open && (
            <Suspense fallback={<div className="h-40 flex items-center justify-center"><div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>}>
              <AddReceiptForm onClose={() => setOpen(false)} />
            </Suspense>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function SummaryCard({ icon: Icon, label, value, hint, tone }: { icon: LucideIcon; label: string; value: React.ReactNode; hint: string; tone: "primary" | "accent" | "success" | "violet" }) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent:  "bg-accent/15 text-accent",
    success: "bg-success/10 text-success",
    violet: "bg-violet-500/10 text-violet-500",
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
