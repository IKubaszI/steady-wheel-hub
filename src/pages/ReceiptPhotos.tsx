import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "./Vehicles";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddReceiptForm } from "@/components/forms/AddReceiptForm";
import { Badge } from "@/components/ui/badge";
import { Camera, Images, Upload, ChevronLeft, ChevronRight, Download, Pencil, Trash2 } from "lucide-react";
import { useGarageData } from "@/context/garage-data";
import { categoryMeta, type Category, type Receipt } from "@/data/mockData";
import { Link } from "react-router-dom";
import { useSettings } from "@/context/settings";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function ReceiptPhotos() {
  const [open, setOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [filterVehicle, setFilterVehicle] = useState<string>("all");
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { receipts, vehicles, deleteReceipt } = useGarageData();
  const { t, format: fmtMoney, language } = useSettings();
  const { toast } = useToast();

  const [selectedReceiptForEdit, setSelectedReceiptForEdit] = useState<Receipt | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null);

  const handleDeleteReceipt = (id: string) => {
    setReceiptToDelete(id);
  };

  const confirmDeleteReceipt = async () => {
    if (!receiptToDelete) return;
    try {
      await deleteReceipt(receiptToDelete);
      toast({
        title: t("common.delete"),
        description: t("activity.receiptToastDeleted"),
      });
    } catch (error) {
      toast({
        title: t("receipt.toast.saveFailed"),
        description: "Could not delete receipt.",
        variant: "destructive",
      });
    } finally {
      setReceiptToDelete(null);
    }
  };

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
        title={t("receipts.receiptPhotos")}
        subtitle={t("photos.subtitle")}
        action={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild className="gap-2">
              <Link to="/receipts"><Images className="h-4 w-4" /> {t("photos.backToReceipts")}</Link>
            </Button>
            <Button onClick={() => setOpen(true)} className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
              <Upload className="h-4 w-4" /> {t("photos.addPhotos")}
            </Button>
          </div>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Stat label={t("photos.albums")} value={String(albums.length)} />
        <Stat label={t("photos.photos")} value={String(photoCount)} />
        <Stat label={t("photos.vehiclesCovered")} value={String(uniqueVehicles)} />
      </div>

      {/* Filters */}
      <div className="surface-card p-4 rounded-lg mb-6 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("receipts.filterBy")}</p>
          {activeFilters && (
            <Button variant="ghost" size="sm" onClick={() => {
              setFilterCategory("all");
              setFilterVehicle("all");
            }}>
              {t("photos.clearFilters")}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-2">{t("common.category")}</label>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={filterCategory === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterCategory("all")}
              >
                {t("photos.allCategories")}
              </Badge>
              {Object.entries(categoryMeta).map(([cat, meta]) => (
                <Badge 
                  key={cat}
                  variant={filterCategory === cat ? "default" : "outline"}
                  className={`cursor-pointer ${filterCategory === cat ? "" : meta.bg}`}
                  onClick={() => setFilterCategory(cat as Category)}
                >
                  {t(`category.${cat}` as any)}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-2">{t("common.vehicle")}</label>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={filterVehicle === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterVehicle("all")}
              >
                {t("photos.allVehicles")}
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
        <p className="text-xs text-muted-foreground">{t("photos.helpText")}</p>
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
                  <h3 className="font-display text-lg font-semibold mt-1">{vehicle ? `${vehicle.brand} ${vehicle.model}` : t("photos.unknownVehicle")}</h3>
                </div>
                <Badge variant="secondary" className={meta.bg}>{t(`category.${receipt.category}` as any)}</Badge>
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
                      <span className="text-white text-xs font-semibold">{t("photos.clickExpand")}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-border/40">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="rounded-full">{fmtMoney(receipt.amount)}</Badge>
                  <Badge variant="outline" className="rounded-full">
                    {receipt.photos.length === 1
                      ? t("photos.countSingle", { count: 1 })
                      : t("photos.countPlural", { count: receipt.photos.length })}
                  </Badge>
                  {receipt.fuelLiters != null && (
                    <Badge variant="outline" className="rounded-full">
                      {language === "pl" ? receipt.fuelLiters.toFixed(1).replace(".", ",") : receipt.fuelLiters.toFixed(1)} L
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1.5 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => {
                      setSelectedReceiptForEdit(receipt);
                      setEditDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                    onClick={() => handleDeleteReceipt(receipt.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {t("common.delete")}
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="surface-card p-10 text-center">
          <Camera className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">{t("photos.noPhotosMatch")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("photos.adjustFilters")}</p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{t("photos.addPhotos")}</DialogTitle>
            <DialogDescription>{t("form.receipt.addDesc")}</DialogDescription>
          </DialogHeader>
          <AddReceiptForm onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <Dialog open={!!lightboxPhoto} onOpenChange={() => setActiveReceipt(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader className="sr-only">
              <DialogTitle>{t("photos.lightboxTitle")}</DialogTitle>
              <DialogDescription>{t("photos.lightboxDesc")}</DialogDescription>
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
                <ChevronLeft className="h-4 w-4 mr-2" /> {t("photos.previous")}
              </Button>
              <span className="text-xs text-muted-foreground">
                {t("photos.photoOf", { current: lightboxIndex + 1, total: activeReceipt?.photos.length ?? 0 })}
              </span>
              <Button
                variant="ghost"
                onClick={() => setLightboxIndex((current) => Math.min((activeReceipt?.photos.length ?? 1) - 1, current + 1))}
                disabled={!activeReceipt || lightboxIndex >= activeReceipt.photos.length - 1}
              >
                {t("photos.next")} <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeReceipt) {
                    setSelectedReceiptForEdit(activeReceipt);
                    setActiveReceipt(null);
                    setEditDialogOpen(true);
                  }
                }}
                className="gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (activeReceipt) {
                    const id = activeReceipt.id;
                    setActiveReceipt(null);
                    handleDeleteReceipt(id);
                  }
                }}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> {t("common.delete")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{t("form.receipt.editTitle")}</DialogTitle>
            <DialogDescription>{t("form.receipt.editDesc")}</DialogDescription>
          </DialogHeader>
          {selectedReceiptForEdit && (
            <AddReceiptForm
              initialReceipt={selectedReceiptForEdit}
              onClose={() => {
                setEditDialogOpen(false);
                setSelectedReceiptForEdit(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={receiptToDelete !== null} onOpenChange={(open) => !open && setReceiptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("activity.deleteConfirmTitle", { item: t("nav.receipts").toLowerCase() })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("activity.deleteConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteReceipt} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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