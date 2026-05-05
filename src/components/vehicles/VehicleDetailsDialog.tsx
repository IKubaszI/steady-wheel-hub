import { format, parseISO } from "date-fns";
import { Car, Gauge, Calendar, Palette, Fuel, Wrench, ReceiptText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useGarageData } from "@/context/garage-data";
import type { Vehicle } from "@/data/mockData";

export function VehicleDetailsDialog({ vehicle, open, onOpenChange }: { vehicle: Vehicle | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { receipts, maintenance } = useGarageData();
  if (!vehicle) return null;

  const vReceipts = receipts.filter((r) => r.vehicleId === vehicle.id);
  const vServices = maintenance.filter((m) => m.vehicleId === vehicle.id);
  const totalSpent = vReceipts.reduce((s, r) => s + r.amount, 0) + vServices.reduce((s, m) => s + m.cost, 0);
  const fuelLiters = vReceipts.filter((r) => r.category === "fuel").reduce((s, r) => s + (r.fuelLiters ?? 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-glow">
              <Car className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl">{vehicle.brand} {vehicle.model}</DialogTitle>
              <DialogDescription>{vehicle.year} · {vehicle.color} · <span className="font-mono">{vehicle.plate}</span></DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          <Stat icon={Gauge} label="Mileage" value={`${(vehicle.mileage / 1000).toFixed(1)}k mi`} />
          <Stat icon={Calendar} label="Next service" value={format(parseISO(vehicle.nextService), "MMM d")} />
          <Stat icon={Palette} label="Color" value={vehicle.color.split(" ")[0]} />
          <Stat icon={Fuel} label="Fuel logged" value={`${fuelLiters.toFixed(0)} L`} />
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <Tile label="Total spend" value={`$${totalSpent.toFixed(0)}`} />
          <Tile label="Receipts" value={String(vReceipts.length)} />
          <Tile label="Services" value={String(vServices.length)} />
        </div>

        <section className="mt-6">
          <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><Wrench className="h-4 w-4 text-primary" /> Recent services</h4>
          <ul className="space-y-2">
            {vServices.slice(0, 4).map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/30 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{m.type}</p>
                  <p className="text-xs text-muted-foreground">{format(parseISO(m.date), "MMM d, yyyy")}</p>
                </div>
                <Badge variant="secondary" className="capitalize rounded-full">{m.status}</Badge>
              </li>
            ))}
            {vServices.length === 0 && <li className="text-sm text-muted-foreground italic">No services yet</li>}
          </ul>
        </section>

        <section className="mt-5">
          <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><ReceiptText className="h-4 w-4 text-primary" /> Recent receipts</h4>
          <ul className="space-y-2">
            {vReceipts.slice(0, 4).map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/30 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{r.vendor}</p>
                  <p className="text-xs text-muted-foreground capitalize">{r.category} · {format(parseISO(r.date), "MMM d, yyyy")}</p>
                </div>
                <p className="text-sm font-bold tabular-nums">${r.amount.toFixed(2)}</p>
              </li>
            ))}
            {vReceipts.length === 0 && <li className="text-sm text-muted-foreground italic">No receipts yet</li>}
          </ul>
        </section>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-xl bg-secondary/60 p-3">
      <div className="flex items-center gap-1 text-muted-foreground"><Icon className="h-3 w-3" /><span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span></div>
      <p className="font-display font-bold mt-0.5">{value}</p>
    </div>
  );
}
function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="font-display text-xl font-bold mt-1">{value}</p>
    </div>
  );
}