import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingServices } from "@/components/dashboard/UpcomingServices";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { DollarSign, CalendarClock, Plus, Receipt as ReceiptIcon, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AddMaintenanceForm } from "@/components/forms/AddMaintenanceForm";
import { AddReceiptForm } from "@/components/forms/AddReceiptForm";
import { useGarageData } from "@/context/garage-data";
import { useSettings } from "@/context/settings";
import { useAuth } from "@/context/auth";
import { useToast } from "@/hooks/use-toast";
import { isSameMonth, parseISO, subMonths } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<null | "service" | "receipt">(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);
  const { receipts, maintenance } = useGarageData();
  const { user } = useAuth();
  const { toast } = useToast();
  const { symbol, currency, t, format: fmtMoney } = useSettings();
  const firstName =
    user?.displayName?.trim().split(/\s+/)[0] ||
    user?.email?.split("@")[0] ||
    t("dashboard.driver");
  const moneyPrefix = currency === "PLN" ? "" : symbol;
  const moneySuffix = currency === "PLN" ? ` ${symbol}` : "";
  const totalExpenses = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const upcoming = maintenance.filter((entry) => entry.status !== "completed").length;
  const thisMonthEntries = [
    ...receipts.map((receipt) => ({ date: receipt.date, amount: receipt.amount })),
    ...maintenance.map((entry) => ({ date: entry.date, amount: entry.cost })),
  ];
  const thisMonthSpend = thisMonthEntries
    .filter((entry) => isSameMonth(parseISO(entry.date), new Date()))
    .reduce((sum, entry) => sum + entry.amount, 0);
  const upcomingThisMonthSpend = maintenance
    .filter((entry) => entry.status !== "completed" && isSameMonth(parseISO(entry.date), new Date()))
    .reduce((sum, entry) => sum + entry.cost, 0);
  const previousMonthDate = subMonths(new Date(), 1);
  const upcomingThisMonthCount = maintenance
    .filter((entry) => entry.status !== "completed" && isSameMonth(parseISO(entry.date), new Date()))
    .length;
  const previousMonthUpcomingCount = maintenance
    .filter((entry) => entry.status !== "completed" && isSameMonth(parseISO(entry.date), previousMonthDate))
    .length;
  const previousMonthSpend = maintenance
    .filter((entry) => isSameMonth(parseISO(entry.date), previousMonthDate))
    .reduce((sum, entry) => sum + entry.cost, 0);


  const getGreetingKey = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "dashboard.goodMorning" as const;
    if (hours < 18) return "dashboard.goodAfternoon" as const;
    return "dashboard.goodEvening" as const;
  };

  return (
    <AppShell onQuickAdd={() => setOpen("receipt")}>
      <div className="hero-bg -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-8 -mt-6 lg:-mt-8 pt-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t("dashboard.welcomeBack")}</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-1 break-all md:break-words">{t(getGreetingKey(), { name: firstName })}</h1>
            <p className="text-muted-foreground mt-1.5 max-w-xl">{t("dashboard.quickLook")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen("receipt")} className="gap-2"><ReceiptIcon className="h-4 w-4" /> {t("dashboard.addReceipt")}</Button>
            <Button onClick={() => setOpen("service")} className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"><Plus className="h-4 w-4" /> {t("dashboard.logService")}</Button>
          </div>
        </div>
      </div>

      {loading ? <DashboardSkeleton /> : (<>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        <div className="animate-fade-in" style={{ animationFillMode: "backwards" }}>
          <StatCard label={t("dashboard.totalExpenses")} value={totalExpenses} prefix={moneyPrefix} suffix={moneySuffix} delta={{ value: t("dashboard.totalExpensesTime"), positive: true }} deltaLabel={t("dashboard.totalExpensesDelta")} icon={DollarSign} tone="primary" hint={t("dashboard.totalExpensesHint")} />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "backwards" }}>
          <StatCard
            label={t("dashboard.upcomingServices")}
            value={upcoming}
            delta={{ value: String(previousMonthUpcomingCount), positive: upcomingThisMonthCount <= previousMonthUpcomingCount }}
            deltaLabel={t("dashboard.upcomingServicesDelta")}
            icon={CalendarClock}
            tone="warning"
            hint={t("dashboard.upcomingServicesHint")}
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "backwards" }}>
          <StatCard label={t("dashboard.spendThisMonth")} value={thisMonthSpend} prefix={moneyPrefix} suffix={moneySuffix} delta={{ value: "live", positive: true }} deltaLabel={t("dashboard.spendThisMonthDelta")} icon={ReceiptIcon} tone="success" hint={t("dashboard.spendThisMonthHint")} />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "backwards" }}>
          <StatCard
            label={t("dashboard.upcomingSpend")}
            value={upcomingThisMonthSpend}
            prefix={moneyPrefix}
            suffix={moneySuffix}
            delta={{ value: `${moneyPrefix}${previousMonthSpend.toFixed(0)}${moneySuffix}`, positive: upcomingThisMonthSpend <= previousMonthSpend }}
            deltaLabel={t("dashboard.upcomingSpendDelta")}
            icon={Wallet}
            tone="violet"
            hint={t("dashboard.upcomingSpendHint")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "backwards" }}>
          <RecentActivity />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: "500ms", animationFillMode: "backwards" }}>
          <UpcomingServices />
        </div>
      </div>
      </>)}

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{open === "service" ? t("form.service.logTitle") : t("form.receipt.addTitle")}</DialogTitle>
            <DialogDescription>{open === "service" ? t("form.service.logDesc") : t("form.receipt.addDesc")}</DialogDescription>
          </DialogHeader>
          {open === "service" && <AddMaintenanceForm onClose={() => setOpen(null)} />}
          {open === "receipt" && <AddReceiptForm onClose={() => setOpen(null)} />}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
