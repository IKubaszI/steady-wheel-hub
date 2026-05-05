import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Filter, Search, Camera, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { categoryMeta, type Category } from "@/data/mockData";
import { useGarageData } from "@/context/garage-data";

const categories: (Category | "all")[] = ["all", "fuel", "parts", "service", "insurance", "other"];

type Props = {
  onAddReceipt?: (category: Category) => void;
  onEditReceipt?: (receiptId: string) => void;
};

export function ReceiptList({ onAddReceipt, onEditReceipt }: Props) {
  const { receipts, vehicles } = useGarageData();
  const [cat, setCat] = useState<Category | "all">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () => receipts
      .filter((receipt) => cat === "all" || receipt.category === cat)
      .filter((receipt) => receipt.vendor.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => +parseISO(b.date) - +parseISO(a.date)),
    [cat, q, receipts]
  );

  const total = filtered.reduce((sum, receipt) => sum + receipt.amount, 0);
  const fuelLiters = filtered.filter((receipt) => receipt.category === "fuel").reduce((sum, receipt) => sum + (receipt.fuelLiters ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="surface-card p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Context</p>
          <h3 className="font-display text-lg font-semibold mt-1">{cat === "all" ? "All receipts" : `${categoryMeta[cat].label} receipts`}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {cat === "fuel"
              ? "Log liters, photos, and a vehicle tag for each fuel receipt."
              : cat === "parts"
                ? "Store parts invoices with a linked vehicle and image proof."
                : "Filter by category, then add receipts with one or more photos."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" asChild className="gap-2">
            <Link to="/receipt-photos"><Camera className="h-4 w-4" /> Receipt photos</Link>
          </Button>
          {cat !== "all" && onAddReceipt && (
            <Button onClick={() => onAddReceipt(cat)} className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
              Add {categoryMeta[cat].label.toLowerCase()} receipt
            </Button>
          )}
        </div>
      </div>

      <div className="surface-card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            {categories.map((category) => {
              const active = cat === category;
              const meta = category !== "all" ? categoryMeta[category] : null;
              return (
                <button
                  key={category}
                  onClick={() => setCat(category)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border",
                    active
                      ? "bg-foreground text-background border-foreground shadow-elev-sm"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  )}
                >
                  {meta && <meta.icon className="inline h-3 w-3 mr-1 -mt-0.5" />}
                  {category}
                </button>
              );
            })}
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search vendor…" className="pl-9 h-9 bg-secondary/60 border-transparent" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{filtered.length}</span> receipts</p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>Total: <span className="font-display font-bold text-lg">${total.toFixed(2)}</span></span>
          {cat === "fuel" && <Badge variant="secondary" className="rounded-full">{fuelLiters.toFixed(1)} L logged</Badge>}
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_140px_140px_120px_100px] gap-4 px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border bg-secondary/40">
          <span>Vendor</span><span>Vehicle</span><span>Category</span><span>Date</span><span className="text-right">Amount</span>
        </div>
        <ul className="divide-y divide-border">
          {filtered.map((receipt) => {
            const vehicle = vehicles.find((entry) => entry.id === receipt.vehicleId)!;
            const meta = categoryMeta[receipt.category];
            const Icon = meta.icon;
            return (
              <li key={receipt.id} className="grid grid-cols-1 md:grid-cols-[1fr_140px_140px_120px_100px] gap-x-4 gap-y-2 px-5 py-4 hover:bg-secondary/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("h-9 w-9 rounded-lg grid place-items-center shrink-0", meta.bg)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{receipt.vendor}</p>
                    <div className="md:hidden flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{vehicle.brand} {vehicle.model}</span>
                      <span>·</span>
                      <span>{format(parseISO(receipt.date), "MMM d")}</span>
                      {receipt.fuelLiters != null && <span>· {receipt.fuelLiters.toFixed(1)} L</span>}
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex items-center self-center">
                  <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">{vehicle.brand} {vehicle.model}</Badge>
                </div>
                <div className="hidden md:flex items-center self-center">
                  <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold capitalize", meta.bg)}>
                    <Icon className="h-3 w-3" /> {meta.label}
                  </span>
                </div>
                <p className="hidden md:block text-sm self-center tabular-nums">{format(parseISO(receipt.date), "MMM d, yyyy")}</p>
                <div className="md:text-right self-center">
                  <p className="font-display font-bold tabular-nums">${receipt.amount.toFixed(2)}</p>
                  {receipt.fuelLiters != null && <p className="text-xs text-muted-foreground">{receipt.fuelLiters.toFixed(1)} L</p>}
                  {onEditReceipt && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="mt-1 h-7 px-2 text-xs"
                      onClick={() => onEditReceipt(receipt.id)}
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="p-10 text-center text-muted-foreground text-sm">No receipts match your filters.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
