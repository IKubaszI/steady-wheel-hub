import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { vehicles } from "@/data/mockData";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddVehicleForm } from "@/components/forms/AddVehicleForm";

export default function Vehicles() {
  const [open, setOpen] = useState(false);
  return (
    <AppShell onQuickAdd={() => setOpen(true)}>
      <PageHeader
        title="Vehicles"
        subtitle={`${vehicles.length} cars in your garage`}
        action={<Button onClick={() => setOpen(true)} className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"><Plus className="h-4 w-4" /> Add vehicle</Button>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {vehicles.map((v) => <VehicleCard key={v.id} v={v} />)}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-xl">Add a new vehicle</DialogTitle><DialogDescription>Store basic details to start tracking maintenance and receipts.</DialogDescription></DialogHeader>
          <AddVehicleForm onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
