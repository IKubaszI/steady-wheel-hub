import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "./Vehicles";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddReceiptForm } from "@/components/forms/AddReceiptForm";
import { Badge } from "@/components/ui/badge";
import { Camera, Images, Upload, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useGarageData } from "@/context/garage-data";
import { categoryMeta, type Category, type Receipt } from "@/data/mockData";
import { Link } from "react-router-dom";

export default function ReceiptPhotos() {
  const [open, setOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [filterVehicle, setFilterVehicle] = useState<string>("all");
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { receipts, vehicles } = useGarageData();

  const albums = useMemo(() => receipts.filter((receipt) => receipt.photos.length > 0), [receipts]);
  
  const filtered = useMemo(() => {
    return albums.filter((receipt) => {
      if (filterCategory !== "all" && receipt.category !== filterCategory) return false;
      if (filterVehicle !== "all" && receipt.vehicleId !== filterVehicle) return false;
      return true;
    });
  }, [albums, filterCategory, filterVehicle]);
  
  const photoCount = filtered.reduce((sum, receipt) => sum + receipt.photos.length, 0);
  const uniqueVehicles = new Set(albums.map((r) => r.vehicleId)).size;
  const lightboxPhoto = activeReceipt?.photos[lightboxIndex] ?? null;
  const activeFilters = filterCategory !== "all" || filterVehicle !== "all";

  return (
    <AppShell onQuickAdd={() => setOpen(true)}>
      <PageHeader
        title="Receipt photos"
        subtitle="A separate archive for receipt images, grouped by vehicle and category"
        action={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild className="gap-2"><Link to="/receipts"><Images className="h-4 w-4" /> Back to receipts</Link></Button>
            <Button onClick={() => setOpen(true)} className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"><Upload className="h-4 w-4" /> Add receipt with photos</Button>
          </div>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Stat label="Albums" value={String(albums.length)} />
        <Stat label="Photos" value={String(photoCount)} />
        <Stat label="Vehicles covered" value={String(uniqueVehicles)} />
      </div>

      {/* Filters */}
      <div className="surface-card p-4 rounded-lg mb-6 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filter by</p>
          {activeFilters && (
            <Button variant="ghost" size="sm" onClick={() => {
              setFilterCategory("all");
              setFilterVehicle("all");
            }}>
              Clear filters
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={filterCategory === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterCategory("all")}
              >
                All categories
              </Badge>
              {Object.entries(categoryMeta).map(([cat, meta]) => (
                <Badge 
                  key={cat}
                  variant={filterCategory === cat ? "default" : "outline"}
                  className={`cursor-pointer ${filterCategory === cat ? "" : meta.bg}`}
                  onClick={() => setFilterCategory(cat as Category)}
                >
                  {meta.label}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-2">Vehicle</label>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={filterVehicle === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterVehicle("all")}
              >
                All vehicles
              </Badge>
              {vehicles.map((v) => (
                <Badge 
                  key={v.id}
                  variant={filterVehicle === v.id ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFilterVehicle(v.id)}
                >
                  {v.brand} {v.model}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Photos are displayed uncropped to keep receipt text readable.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {filtered.map((receipt) => {
          const vehicle = vehicles.find((entry) => entry.id === receipt.vehicleId);
          const meta = categoryMeta[receipt.category];
          const gridClass = receipt.photos.length === 1 ? "grid-cols-1" : receipt.photos.length === 2 ? "grid-cols-2" : "grid-cols-3";

          return (
            <article key={receipt.id} className="surface-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{receipt.vendor}</p>
                  <h3 className="font-display text-lg font-semibold mt-1">{vehicle ? `${vehicle.brand} ${vehicle.model}` : "Unknown vehicle"}</h3>
                </div>
                <Badge variant="secondary" className={meta.bg}>{meta.label}</Badge>
              </div>

              <div className={`grid ${gridClass} gap-3`}>
                {receipt.photos.slice(0, 3).map((photo, index) => (
                  <button
                    key={`${receipt.id}-${index}`}
                    onClick={() => {
                      setActiveReceipt(receipt);
                      setLightboxIndex(index);
                    }}
                    className="relative group aspect-[3/4] w-full rounded-xl overflow-hidden border border-border bg-secondary/40 hover:border-primary hover:shadow-md transition-all cursor-pointer"
                  >
                    <img src={photo} alt={`${receipt.vendor} receipt ${index + 1}`} className="h-full w-full object-contain p-1" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">Click to expand</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="rounded-full">{receipt.amount.toFixed(2)} USD</Badge>
                <Badge variant="outline" className="rounded-full">{receipt.photos.length} photo{receipt.photos.length === 1 ? "" : "s"}</Badge>
                {receipt.fuelLiters != null && <Badge variant="outline" className="rounded-full">{receipt.fuelLiters.toFixed(1)} L</Badge>}
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="surface-card p-10 text-center">
          <Camera className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">No photos match your filters</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting the category or vehicle filter.</p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Add receipt photos</DialogTitle>
            <DialogDescription>Upload one receipt entry with multiple images so it is archived separately.</DialogDescription>
          </DialogHeader>
          <AddReceiptForm onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <Dialog open={!!lightboxPhoto} onOpenChange={() => setActiveReceipt(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader className="sr-only">
              <DialogTitle>Receipt photo preview</DialogTitle>
              <DialogDescription>Browse images attached to this receipt.</DialogDescription>
            </DialogHeader>
            <a
              href={lightboxPhoto}
              download={`${activeReceipt?.vendor ?? "receipt"}-${lightboxIndex + 1}.jpg`}
              className="absolute right-14 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              title="Download photo"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </a>
            <div className="flex items-center justify-center h-[70vh]">
              <img src={lightboxPhoto} alt="Receipt" className="max-h-full max-w-full object-contain rounded-lg" />
            </div>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setLightboxIndex((current) => Math.max(0, current - 1))}
                disabled={lightboxIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Photo {lightboxIndex + 1} of {activeReceipt?.photos.length ?? 0}
              </span>
              <Button
                variant="ghost"
                onClick={() => setLightboxIndex((current) => Math.min((activeReceipt?.photos.length ?? 1) - 1, current + 1))}
                disabled={!activeReceipt || lightboxIndex >= activeReceipt.photos.length - 1}
              >
                Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}