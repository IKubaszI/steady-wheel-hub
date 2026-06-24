import { lazy, Suspense, useState } from "react";
import { categoryMeta } from "@/data/mockData";
import { useGarageData } from "@/context/garage-data";
import { format, parseISO } from "date-fns";
import { Wrench, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
// Lazy-load AddReceiptForm — removes react-hook-form + zod from the Dashboard initial bundle
const AddReceiptForm = lazy(() => import("@/components/forms/AddReceiptForm").then(m => ({ default: m.AddReceiptForm })));
import { useToast } from "@/hooks/use-toast";
import { formatAppError } from "@/lib/errors";
import { useSettings } from "@/context/settings";
import { pl, enUS } from "date-fns/locale";

export function RecentActivity() {
  const { maintenance, receipts, vehicles, deleteReceipt, deleteMaintenance } = useGarageData();
  const { toast } = useToast();
  const [selected, setSelected] = useState<{ kind: "service" | "receipt"; id: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);
  const { t, format: fmtMoney, language } = useSettings();
  const dateLocale = language === "pl" ? pl : enUS;

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

  const handleDelete = async () => {
    if (!selected) return;
    try {
      if (selected.kind === "service") {
        await deleteMaintenance(selected.id);
        toast({ title: t("common.delete"), description: t("activity.serviceToastDeleted") });
      } else {
        await deleteReceipt(selected.id);
        toast({ title: t("common.delete"), description: t("activity.receiptToastDeleted") });
      }
    } catch (error) {
      const message = formatAppError(error, t("ocr.scanFailedDesc"));
      toast({ title: t("ocr.scanFailed"), description: message, variant: "destructive" });
    }
    setSelected(null);
    setDeleteConfirm(false);
  };

  return (
    <>
      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-lg font-semibold">{t("dashboard.recentActivity")}</h3>
            <p className="text-sm text-muted-foreground">{t("dashboard.recentActivitySub")}</p>
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
                  <p className="text-xs text-muted-foreground truncate">{it.sub} · {format(parseISO(it.date), "MMM d, yyyy", { locale: dateLocale })}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{fmtMoney(it.amount)}</p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {it.kind === "receipt" ? t("nav.receipts") : t("category.service")}
                  </p>
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
            <DialogTitle>{selected?.kind === "service" ? t("activity.serviceDetails") : t("activity.receiptDetails")}</DialogTitle>
            <DialogDescription>{t("activity.infoEntry")}</DialogDescription>
          </DialogHeader>
          {selectedItem && selected?.kind === "service" && "type" in selectedItem && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">{t("activity.serviceType")}</label>
                <p className="text-base font-medium">{selectedItem.type}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">{t("activity.vehicle")}</label>
                <p className="text-base font-medium">{vehicleName(selectedItem.vehicleId)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t("activity.date")}</label>
                  <p className="text-base font-medium">{format(parseISO(selectedItem.date), "MMM d, yyyy", { locale: dateLocale })}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t("activity.cost")}</label>
                  <p className="text-base font-medium">{fmtMoney(selectedItem.cost)}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">{t("activity.status")}</label>
                <p className="text-base font-medium capitalize">{t(`status.${selectedItem.status}` as any)}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">{t("activity.notes")}</label>
                <p className="text-sm text-foreground/80">{selectedItem.notes || "—"}</p>
              </div>
              <Button variant="destructive" className="w-full gap-2" onClick={() => setDeleteConfirm(true)}>
                <Trash2 className="h-4 w-4" /> {t("activity.deleteService")}
              </Button>
            </div>
          )}
          {selectedItem && selected?.kind === "receipt" && "vendor" in selectedItem && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">{t("activity.vendor")}</label>
                <p className="text-base font-medium">{selectedItem.vendor}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">{t("activity.vehicle")}</label>
                <p className="text-base font-medium">{vehicleName(selectedItem.vehicleId)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t("activity.category")}</label>
                  <p className="text-base font-medium">{t(`category.${selectedItem.category}` as any)}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t("activity.amount")}</label>
                  <p className="text-base font-medium">{fmtMoney(selectedItem.amount)}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">{t("activity.date")}</label>
                <p className="text-base font-medium">{format(parseISO(selectedItem.date), "MMM d, yyyy", { locale: dateLocale })}</p>
              </div>
              {selectedItem.fuelLiters && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t("activity.fuelLiters")}</label>
                  <p className="text-base font-medium">{selectedItem.fuelLiters.toFixed(1)}L</p>
                </div>
              )}
              {selectedItem.photos && selectedItem.photos.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t("activity.photos")}</label>
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
                  <Pencil className="h-4 w-4" /> {t("activity.editReceipt")}
                </Button>
                <Button variant="destructive" className="w-full gap-2" onClick={() => setDeleteConfirm(true)}>
                  <Trash2 className="h-4 w-4" /> {t("activity.deleteReceipt")}
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
            <DialogTitle>{t("form.receipt.editTitle")}</DialogTitle>
            <DialogDescription>{t("form.receipt.editDesc")}</DialogDescription>
          </DialogHeader>
          {editingReceipt && (
            <Suspense fallback={<div className="h-40 flex items-center justify-center"><div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>}>
              <AddReceiptForm onClose={() => setEditingReceiptId(null)} initialReceipt={editingReceipt} />
            </Suspense>
          )}
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
            <AlertDialogTitle>
              {t("activity.deleteConfirmTitle", { item: selected?.kind === "service" ? t("category.service").toLowerCase() : t("nav.receipts").toLowerCase() })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("activity.deleteConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
