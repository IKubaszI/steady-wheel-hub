import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingServices } from "@/components/dashboard/UpcomingServices";
import { Car, Wrench, DollarSign, CalendarClock, Plus, Receipt as ReceiptIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AddMaintenanceForm } from "@/components/forms/AddMaintenanceForm";
import { AddReceiptForm } from "@/components/forms/AddReceiptForm";
import { receipts, maintenance, vehicles } from "@/data/mockData";

export default function Dashboard() {
  const [open, setOpen] = useState<null | "service" | "receipt">(null);
  const totalExpenses = receipts.reduce((s, r) => s + r.amount, 0);
  const upcoming = maintenance.filter((m) => m.status !== "completed").length;

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
        <StatCard label="Total expenses" value={`$${totalExpenses.toFixed(0)}`} delta={{ value: "8.2%", positive: false }} icon={DollarSign} tone="primary" hint="All vehicles, last 30 days" />
        <StatCard label="Upcoming services" value={String(upcoming)} delta={{ value: "2", positive: true }} icon={CalendarClock} tone="warning" hint="Next within 14 days" />
        <StatCard label="Vehicles tracked" value={String(vehicles.length)} icon={Car} tone="accent" hint="2 EV · 2 ICE" />
        <StatCard label="Services logged" value={String(maintenance.length)} delta={{ value: "12.5%", positive: true }} icon={Wrench} tone="success" hint="This year" />
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
