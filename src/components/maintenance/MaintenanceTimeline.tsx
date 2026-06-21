import { type ServiceStatus, type Maintenance } from "@/data/mockData";
import { useGarageData } from "@/context/garage-data";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Clock, AlertTriangle, Wrench, Pencil, Trash2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditMaintenanceForm } from "@/components/forms/EditMaintenanceForm";
import { useToast } from "@/hooks/use-toast";
import { formatAppError } from "@/lib/errors";
import { useSettings } from "@/context/settings";
import { type TranslationKey } from "@/lib/translations";

const statusMap: Record<ServiceStatus, { labelKey: TranslationKey; cls: string; icon: LucideIcon }> = {
  completed: { labelKey: "status.completed", cls: "bg-success/10 text-success border-success/30", icon: CheckCircle2 },
  upcoming:  { labelKey: "status.upcoming",  cls: "bg-primary/10 text-primary border-primary/30",  icon: Clock },
  overdue:   { labelKey: "status.overdue",   cls: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertTriangle },
};

type Props = {
  status?: ServiceStatus | "all";
};

export function MaintenanceTimeline({ status = "all" }: Props) {
  const { maintenance, vehicles, deleteMaintenance } = useGarageData();
  const { toast } = useToast();
  const { format: fmtMoney, t, language } = useSettings();
  const [editing, setEditing] = useState<Maintenance | null>(null);
  const [deleting, setDeleting] = useState<Maintenance | null>(null);
  
  const sorted = [...maintenance]
    .filter((entry) => status === "all" || entry.status === status)
    .sort((a, b) => +parseISO(b.date) - +parseISO(a.date));

  return (
    <>
    <ol className="relative border-l-2 border-dashed border-border ml-4 space-y-6">
      {sorted.map((m) => {
        const v = vehicles.find((x) => x.id === m.vehicleId)!;
        const s = statusMap[m.status];
        const SIcon = s.icon;
        return (
          <li key={m.id} className="ml-6 relative animate-fade-in">
            <span className="absolute -left-[34px] top-1 h-7 w-7 rounded-full bg-card border-2 border-border grid place-items-center shadow-elev-sm">
              <Wrench className="h-3.5 w-3.5 text-primary" />
            </span>
            <div className="surface-card p-5 group transition-all hover:shadow-elev-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display text-base font-semibold">{m.type}</h4>
                    <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border", s.cls)}>
                      <SIcon className="h-3 w-3" /> {t(s.labelKey)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {v.brand} {v.model} · {format(parseISO(m.date), "MMMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-display text-lg font-bold tabular-nums">{fmtMoney(m.cost)}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(m)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleting(m)} aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{m.notes}</p>
            </div>
          </li>
        );
      })}
      {sorted.length === 0 && (
        <li className="ml-6 text-sm text-muted-foreground italic">{t("maintenance.noServices")}</li>
      )}
    </ol>

    <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t("form.service.editTitle")}</DialogTitle>
          <DialogDescription>{t("form.service.editDesc")}</DialogDescription>
        </DialogHeader>
        {editing && <EditMaintenanceForm entry={editing} onClose={() => setEditing(null)} />}
      </DialogContent>
    </Dialog>

    <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("maintenance.delete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {deleting ? t("maintenance.delete.confirm", { type: deleting.type, date: format(parseISO(deleting.date), language === "pl" ? "yyyy-MM-dd" : "MMM d, yyyy") }) : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={async () => {
              if (deleting) {
                try {
                  await deleteMaintenance(deleting.id);
                  toast({ title: t("common.delete"), description: t("activity.serviceToastDeleted") });
                } catch (error) {
                  const message = formatAppError(error, "Could not delete maintenance entry.");
                  toast({ title: t("maintenance.toast.saveFailed"), description: message, variant: "destructive" });
                }
              }
              setDeleting(null);
            }}
          >
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
