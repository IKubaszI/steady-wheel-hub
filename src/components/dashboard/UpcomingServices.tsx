import { useState } from "react";
import { useGarageData } from "@/context/garage-data";
import { format, parseISO, differenceInDays } from "date-fns";
import { CalendarClock, AlertTriangle, CheckCircle, Trash2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";

export function UpcomingServices() {
  const { maintenance, vehicles, updateMaintenance, deleteMaintenance } = useGarageData();
  const [selected, setSelected] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const items = maintenance
    .filter((m) => m.status !== "completed")
    .sort((a, b) => +parseISO(a.date) - +parseISO(b.date));
  const totalPending = items.length;
  const previewItems = items.slice(0, 4);

  const selectedItem = selected ? maintenance.find((m) => m.id === selected) : null;

  const handleMarkCompleted = () => {
    if (selectedItem) {
      updateMaintenance(selectedItem.id, { status: "completed" });
      setSelected(null);
    }
  };

  const handleDelete = () => {
    if (selected) {
      deleteMaintenance(selected);
      setSelected(null);
      setDeleteConfirm(false);
    }
  };

  return (
    <>
      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-lg font-semibold">Upcoming services</h3>
            <p className="text-sm text-muted-foreground">{totalPending} pending service{totalPending === 1 ? "" : "s"}</p>
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
                  <span className="sr-only">{format(parseISO(m.date), "MMMM yyyy")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{m.type}</p>
                  <p className="text-xs text-muted-foreground truncate">{v.brand} {v.model} · {v.plate}</p>
                </div>
                <div className="text-right">
                  {overdue ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                      <AlertTriangle className="h-3 w-3" /> Overdue
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-primary">in {days}d</span>
                  )}
                  <p className="text-[11px] text-muted-foreground tabular-nums">${m.cost.toFixed(0)}</p>
                </div>
              </li>
            );
          })}
        </ul>
        {totalPending > previewItems.length && (
          <Button variant="ghost" asChild className="mt-4 w-full justify-between px-0 text-primary hover:bg-transparent">
            <Link to="/maintenance">
              View all services
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={selected !== null && !deleteConfirm} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Service Details</DialogTitle>
            <DialogDescription>Information about this maintenance entry</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Service Type</label>
                <p className="text-base font-medium">{selectedItem.type}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Vehicle</label>
                <p className="text-base font-medium">
                  {vehicles.find((v) => v.id === selectedItem.vehicleId)?.brand}{" "}
                  {vehicles.find((v) => v.id === selectedItem.vehicleId)?.model} (
                  {vehicles.find((v) => v.id === selectedItem.vehicleId)?.plate})
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Scheduled Date</label>
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
              <div className="flex gap-3">
                {selectedItem.status !== "completed" && (
                  <Button onClick={handleMarkCompleted} className="flex-1 gap-2">
                    <CheckCircle className="h-4 w-4" /> Mark Completed
                  </Button>
                )}
                <Button variant="destructive" className="flex-1 gap-2" onClick={() => setDeleteConfirm(true)}>
                  <Trash2 className="h-4 w-4" /> Delete
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
            <AlertDialogTitle>Delete service entry?</AlertDialogTitle>
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
