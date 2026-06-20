import { useState } from "react";
import { useGarageData } from "@/context/garage-data";
import { format, parseISO, differenceInDays } from "date-fns";
import { CalendarClock, AlertTriangle, CheckCircle, Trash2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatAppError } from "@/lib/errors";
import { useSettings } from "@/context/settings";
import { pl, enUS } from "date-fns/locale";

export function UpcomingServices() {
  const { maintenance, vehicles, updateMaintenance, deleteMaintenance } = useGarageData();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const { t, format: fmtMoney, language } = useSettings();
  const dateLocale = language === "pl" ? pl : enUS;

  const items = maintenance
    .filter((m) => m.status !== "completed")
    .sort((a, b) => +parseISO(a.date) - +parseISO(b.date));
  const totalPending = items.length;
  const previewItems = items.slice(0, 4);

  const selectedItem = selected ? maintenance.find((m) => m.id === selected) : null;

  const handleMarkCompleted = async () => {
    if (selectedItem) {
      try {
        await updateMaintenance(selectedItem.id, { status: "completed" });
        toast({ title: t("ocr.scanComplete"), description: t("activity.serviceToastDeleted") });
        setSelected(null);
      } catch (error) {
        const message = formatAppError(error, t("ocr.scanFailedDesc"));
        toast({ title: t("ocr.scanFailed"), description: message, variant: "destructive" });
      }
    }
  };

  const handleDelete = async () => {
    if (selected) {
      try {
        await deleteMaintenance(selected);
        toast({ title: t("common.delete"), description: t("activity.serviceToastDeleted") });
        setSelected(null);
        setDeleteConfirm(false);
      } catch (error) {
        const message = formatAppError(error, t("ocr.scanFailedDesc"));
        toast({ title: t("ocr.scanFailed"), description: message, variant: "destructive" });
      }
    }
  };

  return (
    <>
      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-lg font-semibold">{t("dashboard.upcomingServices")}</h3>
            <p className="text-sm text-muted-foreground">{t("notify.pending", { count: totalPending })}</p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="h-5 w-5" />
          </div>
        </div>
        <ul className="space-y-3">
          {previewItems.map((m) => {
            const v = vehicles.find((x) => x.id === m.vehicleId)!;
            const days = differenceInDays(parseISO(m.date), new Date());
            const overdue = m.status === "overdue";
            return (
              <li
                key={m.id}
                onClick={() => setSelected(m.id)}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                  overdue
                    ? "border-destructive/30 bg-destructive/5 hover:border-destructive/50 hover:bg-destructive/10"
                    : "border-border/60 hover:border-primary/40 hover:bg-primary/5"
                )}
              >
                <div className={cn(
                  "h-12 w-12 rounded-xl grid place-items-center font-display font-bold text-sm",
                  overdue ? "bg-destructive text-destructive-foreground" : "bg-primary/10 text-primary"
                )}>
                  {format(parseISO(m.date), "dd")}
                  <span className="sr-only">{format(parseISO(m.date), "MMMM yyyy", { locale: dateLocale })}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{m.type}</p>
                  <p className="text-xs text-muted-foreground truncate">{v.brand} {v.model} · {v.plate}</p>
                </div>
                <div className="text-right">
                  {overdue ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                      <AlertTriangle className="h-3 w-3" /> {t("status.overdue")}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-primary">{t("notify.days", { days })}</span>
                  )}
                  <p className="text-[11px] text-muted-foreground tabular-nums">{fmtMoney(m.cost, { decimals: 0 })}</p>
                </div>
              </li>
            );
          })}
        </ul>
        {totalPending > previewItems.length && (
          <Button variant="ghost" asChild className="mt-4 w-full justify-between px-0 text-primary hover:bg-transparent">
            <Link to="/maintenance">
              {t("maintenance.title")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={selected !== null && !deleteConfirm} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("maintenance.serviceDetails")}</DialogTitle>
            <DialogDescription>{t("maintenance.infoEntry")}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">{t("maintenance.serviceType")}</label>
                <p className="text-base font-medium">{selectedItem.type}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">{t("activity.vehicle")}</label>
                <p className="text-base font-medium">
                  {vehicles.find((v) => v.id === selectedItem.vehicleId)?.brand}{" "}
                  {vehicles.find((v) => v.id === selectedItem.vehicleId)?.model} (
                  {vehicles.find((v) => v.id === selectedItem.vehicleId)?.plate})
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">{t("maintenance.scheduledDate")}</label>
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
                <label className="text-xs font-semibold text-muted-foreground uppercase">{t("maintenance.notes")}</label>
                <p className="text-sm text-foreground/80">{selectedItem.notes || "—"}</p>
              </div>
              <div className="flex gap-3">
                {selectedItem.status !== "completed" && (
                  <Button onClick={handleMarkCompleted} className="flex-1 gap-2">
                    <CheckCircle className="h-4 w-4" /> {t("maintenance.markCompleted")}
                  </Button>
                )}
                <Button variant="destructive" className="flex-1 gap-2" onClick={() => setDeleteConfirm(true)}>
                  <Trash2 className="h-4 w-4" /> {t("common.delete")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("maintenance.delete.title")}</AlertDialogTitle>
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
