import { type ServiceStatus, type Maintenance } from "@/data/mockData";
import { useGarageData } from "@/context/garage-data";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Clock, AlertTriangle, Wrench, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditMaintenanceForm } from "@/components/forms/EditMaintenanceForm";

const statusMap: Record<ServiceStatus, { label: string; key: string; icon: any }> = {
  completed: { label: "Completed", key: "completed", icon: CheckCircle2 },
  upcoming:  { label: "Upcoming",  key: "upcoming",  icon: Clock },
  overdue:   { label: "Overdue",   key: "overdue",   icon: AlertTriangle },
};

type Props = {
  status?: ServiceStatus | "all";
};

export function MaintenanceTimeline({ status = "all" }: Props) {
  const { maintenance, vehicles, deleteMaintenance } = useGarageData();
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
                    <span className={cn("status-pill", s.key)}>
                      <span className="dot" /> {s.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {v.brand} {v.model} · {format(parseISO(m.date), "MMMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-display text-lg font-bold tabular-nums">${m.cost.toFixed(2)}</p>
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
        <li className="ml-6 text-sm text-muted-foreground italic">No services in this view.</li>
      )}
    </ol>

    <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Edit maintenance entry</DialogTitle>
          <DialogDescription>Update the details of this service.</DialogDescription>
        </DialogHeader>
        {editing && <EditMaintenanceForm entry={editing} onClose={() => setEditing(null)} />}
      </DialogContent>
    </Dialog>

    <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this maintenance entry?</AlertDialogTitle>
          <AlertDialogDescription>
            {deleting ? `${deleting.type} on ${format(parseISO(deleting.date), "MMM d, yyyy")} will be removed permanently.` : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => { if (deleting) deleteMaintenance(deleting.id); setDeleting(null); }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
