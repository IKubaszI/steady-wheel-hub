import { useState } from "react";
import { categoryMeta } from "@/data/mockData";
import { useGarageData } from "@/context/garage-data";
import { format, parseISO } from "date-fns";
import { Wrench, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AddReceiptForm } from "@/components/forms/AddReceiptForm";

export function RecentActivity() {
  const { maintenance, receipts, vehicles, deleteReceipt, deleteMaintenance } = useGarageData();
  const [selected, setSelected] = useState<{ kind: "service" | "receipt"; id: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);
  const editingReceipt = editingReceiptId ? receipts.find((receipt) => receipt.id === editingReceiptId) ?? null : null;

  const vehicleName = (id: string) => {
    const v = vehicles.find((x) => x.id === id);
    return v ? `${v.brand} ${v.model}` : "Unknown";
  };

  const items = [
    ...maintenance.slice(0, 3).map((m) => ({
      kind: "service" as const,
      id: m.id, title: m.type, sub: vehicleName(m.vehicleId), date: m.date, amount: m.cost,
    })),
    ...receipts.slice(0, 3).map((r) => ({
      kind: "receipt" as const,
      id: r.id, title: r.vendor, sub: vehicleName(r.vehicleId), date: r.date, amount: r.amount, category: r.category,
    })),
  ].sort((a, b) => +parseISO(b.date) - +parseISO(a.date));

  const selectedItem = selected
    ? selected.kind === "service"
      ? maintenance.find((m) => m.id === selected.id)
      : receipts.find((r) => r.id === selected.id)
    : null;

  const handleDelete = () => {
    if (!selected) return;
    if (selected.kind === "service") {
      deleteMaintenance(selected.id);
    } else {
      deleteReceipt(selected.id);
    }
    setSelected(null);
    setDeleteConfirm(false);
  };

  return (
    <>
      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-lg font-semibold">Recent activity</h3>
            <p className="text-sm text-muted-foreground">Latest services and receipts</p>
          </div>
        </div>
        <ul className="divide-y divide-border/60">
          {items.map((it) => {
            const Icon = it.kind === "receipt" ? categoryMeta[it.category!].icon : Wrench;
            const tone = it.kind === "receipt" ? categoryMeta[it.category!].bg : "bg-primary/10 text-primary";
            return (
              <li
                key={`${it.kind}-${it.id}`}
                onClick={() => setSelected(it)}
                className="flex items-center gap-4 py-3 group cursor-pointer hover:bg-muted/50 -mx-6 px-6 transition-colors"
              >
                <div className={`h-10 w-10 rounded-xl grid place-items-center ${tone} transition-transform group-hover:scale-105`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{it.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{it.sub} · {format(parseISO(it.date), "MMM d, yyyy")}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">${it.amount.toFixed(2)}</p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{it.kind}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={selected !== null && !deleteConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setPhotoPreview(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.kind === "service" ? "Service Details" : "Receipt Details"}</DialogTitle>
            <DialogDescription>Full information about this entry</DialogDescription>
          </DialogHeader>
          {selectedItem && selected?.kind === "service" && "type" in selectedItem && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Service Type</label>
                <p className="text-base font-medium">{selectedItem.type}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Vehicle</label>
                <p className="text-base font-medium">{vehicleName(selectedItem.vehicleId)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Date</label>
                  <p className="text-base font-medium">{format(parseISO(selectedItem.date), "MMM d, yyyy")}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Cost</label>
                  <p className="text-base font-medium">${selectedItem.cost.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
                <p className="text-base font-medium capitalize">{selectedItem.status}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Notes</label>
                <p className="text-sm text-foreground/80">{selectedItem.notes || "—"}</p>
              </div>
              <Button variant="destructive" className="w-full gap-2" onClick={() => setDeleteConfirm(true)}>
                <Trash2 className="h-4 w-4" /> Delete Service
              </Button>
            </div>
          )}
          {selectedItem && selected?.kind === "receipt" && "vendor" in selectedItem && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Vendor</label>
                <p className="text-base font-medium">{selectedItem.vendor}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Vehicle</label>
                <p className="text-base font-medium">{vehicleName(selectedItem.vehicleId)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Category</label>
                  <p className="text-base font-medium">{categoryMeta[selectedItem.category].label}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Amount</label>
                  <p className="text-base font-medium">${selectedItem.amount.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Date</label>
                <p className="text-base font-medium">{format(parseISO(selectedItem.date), "MMM d, yyyy")}</p>
              </div>
              {selectedItem.fuelLiters && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Fuel Liters</label>
                  <p className="text-base font-medium">{selectedItem.fuelLiters.toFixed(1)}L</p>
                </div>
              )}
              {selectedItem.photos && selectedItem.photos.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Photos</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {selectedItem.photos.map((photo, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPhotoPreview(photo)}
                        className="aspect-[3/4] rounded-lg border border-border bg-secondary/40 overflow-hidden cursor-zoom-in hover:border-primary transition-colors"
                        aria-label={`Preview receipt photo ${idx + 1}`}
                      >
                        <img src={photo} alt="Receipt" className="h-full w-full object-contain p-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    setEditingReceiptId(selectedItem.id);
                    setSelected(null);
                  }}
                >
                  <Pencil className="h-4 w-4" /> Edit Receipt
                </Button>
                <Button variant="destructive" className="w-full gap-2" onClick={() => setDeleteConfirm(true)}>
                  <Trash2 className="h-4 w-4" /> Delete Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Receipt */}
      <Dialog open={editingReceipt !== null} onOpenChange={(open) => !open && setEditingReceiptId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit receipt</DialogTitle>
            <DialogDescription>Update expense details, tags, and photos.</DialogDescription>
          </DialogHeader>
          {editingReceipt && <AddReceiptForm onClose={() => setEditingReceiptId(null)} initialReceipt={editingReceipt} />}
        </DialogContent>
      </Dialog>

      {/* Photo Preview */}
      <Dialog open={photoPreview !== null} onOpenChange={(open) => !open && setPhotoPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Receipt photo preview</DialogTitle>
            <DialogDescription>Enlarged receipt image from recent activity.</DialogDescription>
          </DialogHeader>
          {photoPreview && (
            <div className="max-h-[75vh] w-full bg-secondary/30 rounded-lg overflow-hidden grid place-items-center">
              <img src={photoPreview} alt="Receipt preview" className="max-h-[75vh] w-full object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected?.kind === "service" ? "service" : "receipt"}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
