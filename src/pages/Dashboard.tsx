import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingServices } from "@/components/dashboard/UpcomingServices";
import { DollarSign, CalendarClock, Plus, Receipt as ReceiptIcon, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AddMaintenanceForm } from "@/components/forms/AddMaintenanceForm";
import { AddReceiptForm } from "@/components/forms/AddReceiptForm";
import { useGarageData } from "@/context/garage-data";
import { isSameMonth, parseISO, subMonths } from "date-fns";

export default function Dashboard() {
  const [open, setOpen] = useState<null | "service" | "receipt">(null);
  const { receipts, maintenance } = useGarageData();
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

  return (
    <AppShell onQuickAdd={() => setOpen("receipt")}>
      <div className="hero-bg -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-8 -mt-6 lg:-mt-8 pt-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Welcome back</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">Good morning, Alex 👋</h1>
            <p className="text-muted-foreground mt-1.5 max-w-xl">Here's a quick look at your fleet, upcoming services, and spending this month.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen("receipt")} className="gap-2"><ReceiptIcon className="h-4 w-4" /> Add receipt</Button>
            <Button onClick={() => setOpen("service")} className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"><Plus className="h-4 w-4" /> Log service</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        <StatCard label="Total expenses" value={`$${totalExpenses.toFixed(0)}`} delta={{ value: "all time", positive: true }} deltaLabel="across all saved receipts" icon={DollarSign} tone="primary" hint="All recorded spending" />
        <StatCard
          label="Upcoming services"
          value={String(upcoming)}
          delta={{ value: String(previousMonthUpcomingCount), positive: upcomingThisMonthCount <= previousMonthUpcomingCount }}
          deltaLabel="vs. previous month due services"
          icon={CalendarClock}
          tone="warning"
          hint={`${upcomingThisMonthCount} due this month (upcoming + overdue)`}
        />
        <StatCard label="Spend this month" value={`$${thisMonthSpend.toFixed(0)}`} delta={{ value: "live", positive: true }} deltaLabel="calendar month only" icon={ReceiptIcon} tone="success" hint="Fuel, parts, and services" />
        <StatCard
          label="Upcoming spend this month"
          value={`$${upcomingThisMonthSpend.toFixed(0)}`}
          delta={{ value: `$${previousMonthSpend.toFixed(0)}`, positive: upcomingThisMonthSpend <= previousMonthSpend }}
          deltaLabel="vs. previous month spend"
          icon={Wallet}
          tone="accent"
          hint="Planned maintenance only"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        <div className="lg:col-span-2"><RecentActivity /></div>
        <UpcomingServices />
      </div>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{open === "service" ? "Log a maintenance service" : "Add a receipt"}</DialogTitle>
            <DialogDescription>{open === "service" ? "Record a completed or upcoming service." : "Track a new car-related expense."}</DialogDescription>
          </DialogHeader>
          {open === "service" ? <AddMaintenanceForm onClose={() => setOpen(null)} /> : <AddReceiptForm onClose={() => setOpen(null)} />}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
