import { useMemo, useState } from "react";
import { receipts, vehicles, categoryMeta, type Category } from "@/data/mockData";
import { format, parseISO } from "date-fns";
import { Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories: (Category | "all")[] = ["all", "fuel", "parts", "service", "insurance", "other"];

export function ReceiptList() {
  const [cat, setCat] = useState<Category | "all">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() =>
    receipts
      .filter((r) => cat === "all" || r.category === cat)
      .filter((r) => r.vendor.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => +parseISO(b.date) - +parseISO(a.date)),
    [cat, q]
  );

  const total = filtered.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="surface-card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            {categories.map((c) => {
              const active = cat === c;
              const meta = c !== "all" ? categoryMeta[c] : null;
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border",
                    active
                      ? "bg-foreground text-background border-foreground shadow-elev-sm"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  )}
                >
                  {meta && <meta.icon className="inline h-3 w-3 mr-1 -mt-0.5" />}
                  {c}
                </button>
              );
            })}
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vendor…" className="pl-9 h-9 bg-secondary/60 border-transparent" />
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{filtered.length}</span> receipts</p>
        <p className="text-sm">Total: <span className="font-display font-bold text-lg">${total.toFixed(2)}</span></p>
      </div>

      {/* List */}
      <div className="surface-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_140px_140px_120px_100px] gap-4 px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border bg-secondary/40">
          <span>Vendor</span><span>Vehicle</span><span>Category</span><span>Date</span><span className="text-right">Amount</span>
        </div>
        <ul className="divide-y divide-border">
          {filtered.map((r) => {
            const v = vehicles.find((x) => x.id === r.vehicleId)!;
            const meta = categoryMeta[r.category];
            const Icon = meta.icon;
            return (
              <li key={r.id} className="grid grid-cols-1 md:grid-cols-[1fr_140px_140px_120px_100px] gap-x-4 gap-y-2 px-5 py-4 hover:bg-secondary/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("h-9 w-9 rounded-lg grid place-items-center shrink-0", meta.bg)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.vendor}</p>
                    <p className="md:hidden text-xs text-muted-foreground">{v.brand} {v.model} · {format(parseISO(r.date), "MMM d")}</p>
                  </div>
                </div>
                <p className="hidden md:block text-sm text-muted-foreground truncate self-center">{v.brand} {v.model}</p>
                <div className="hidden md:flex items-center self-center">
                  <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold capitalize", meta.bg)}>
                    <Icon className="h-3 w-3" /> {meta.label}
                  </span>
                </div>
                <p className="hidden md:block text-sm self-center tabular-nums">{format(parseISO(r.date), "MMM d, yyyy")}</p>
                <p className="font-display font-bold tabular-nums md:text-right self-center">${r.amount.toFixed(2)}</p>
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
