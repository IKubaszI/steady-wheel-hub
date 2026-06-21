import { useState, useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { Button } from "@/components/ui/button";
import { Plus, Fuel, ReceiptText, Wrench, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddVehicleForm } from "@/components/forms/AddVehicleForm";
import { AddReceiptForm } from "@/components/forms/AddReceiptForm";
import { useGarageData } from "@/context/garage-data";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isSameMonth, parseISO } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatAppError } from "@/lib/errors";
import type { LucideIcon } from "lucide-react";
import { useSettings } from "@/context/settings";
import { pl, enUS } from "date-fns/locale";

export default function Vehicles() {
  const [open, setOpen] = useState(false);
  const [receiptVehicleId, setReceiptVehicleId] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<string | null>(null);
  const { vehicles, receipts, maintenance, deleteVehicle } = useGarageData();
  const { toast } = useToast();
  const { t, format: fmtMoney, language } = useSettings();
  const dateLocale = language === "pl" ? pl : enUS;

  useEffect(() => {
    const onboardingFlag = sessionStorage.getItem("steadywheelhub.onboarding");
    if (onboardingFlag === "1") {
      setOpen(true);
      toast({
        title: t("dashboard.onboarding.title"),
        description: t("auth.toast.onboarding"),
      });
      sessionStorage.removeItem("steadywheelhub.onboarding");
    }
  }, [toast, t]);

  const vehicleToEdit = editingVehicle ? vehicles.find((vehicle) => vehicle.id === editingVehicle) ?? null : null;
  const vehicleToDelete = deletingVehicle ? vehicles.find((vehicle) => vehicle.id === deletingVehicle) ?? null : null;
  const deleteSummary = vehicleToDelete
    ? {
        receipts: receipts.filter((receipt) => receipt.vehicleId === vehicleToDelete.id).length,
        services: maintenance.filter((entry) => entry.vehicleId === vehicleToDelete.id).length,
      }
    : null;

  return (
    <AppShell onQuickAdd={() => setReceiptVehicleId("general")}>
      <PageHeader
        title={t("vehicles.title")}
        subtitle={t("vehicles.subtitle")}
        action={<Button onClick={() => setOpen(true)} className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"><Plus className="h-4 w-4" /> {t("vehicles.addVehicle")}</Button>}
      />

      <Tabs defaultValue="all" className="space-y-5">
        <TabsList className="flex w-full flex-wrap h-auto justify-start gap-2 bg-transparent p-0">
          <TabsTrigger value="all">{t("vehicles.allVehicles")}</TabsTrigger>
          {vehicles.map((vehicle) => (
            <TabsTrigger key={vehicle.id} value={vehicle.id}>{vehicle.brand} {vehicle.model}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {vehicles.map((vehicle) => <VehicleCard key={vehicle.id} v={vehicle} />)}
          </div>
        </TabsContent>

        {vehicles.map((vehicle) => {
          const vehicleReceipts = receipts.filter((receipt) => receipt.vehicleId === vehicle.id).sort((a, b) => +parseISO(b.date) - +parseISO(a.date));
          const vehicleServices = maintenance.filter((entry) => entry.vehicleId === vehicle.id).sort((a, b) => +parseISO(b.date) - +parseISO(a.date));
          const fuelLiters = vehicleReceipts.filter((receipt) => receipt.category === "fuel").reduce((sum, receipt) => sum + (receipt.fuelLiters ?? 0), 0);
          const totalSpent = vehicleReceipts.reduce((sum, receipt) => sum + receipt.amount, 0) + vehicleServices.reduce((sum, entry) => sum + entry.cost, 0);
          const spendThisMonth =
            vehicleReceipts
              .filter((receipt) => isSameMonth(parseISO(receipt.date), new Date()))
              .reduce((sum, receipt) => sum + receipt.amount, 0) +
            vehicleServices
              .filter((entry) => isSameMonth(parseISO(entry.date), new Date()))
              .reduce((sum, entry) => sum + entry.cost, 0);

          return (
            <TabsContent key={vehicle.id} value={vehicle.id}>
              <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-5">
                <VehicleCard v={vehicle} />
                <div className="surface-card p-6 space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("vehicles.vehicleTag")}</p>
                      <h3 className="font-display text-lg font-semibold mt-1">{vehicle.brand} {vehicle.model}</h3>
                    </div>
                    <Badge variant="secondary" className="rounded-full px-3 py-1">{vehicle.plate}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="gap-2" onClick={() => setEditingVehicle(vehicle.id)}>
                      <Pencil className="h-4 w-4" /> {t("vehicles.editVehicle")}
                    </Button>
                    <Button variant="destructive" className="gap-2" onClick={() => setDeletingVehicle(vehicle.id)}>
                      <Trash2 className="h-4 w-4" /> {t("vehicles.deleteVehicle")}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <InfoCard label={t("vehicles.totalSpend")} value={fmtMoney(totalSpent, { decimals: 0 })} subtext={`(${t("vehicles.spendThisMonth")}: ${fmtMoney(spendThisMonth, { decimals: 0 })})`} icon={ReceiptText} />
                    <InfoCard label={t("vehicles.fuelLogged")} value={`${fuelLiters.toFixed(1)} L`} icon={Fuel} />
                    <InfoCard label={t("vehicles.receipts")} value={String(vehicleReceipts.length)} icon={ReceiptText} />
                    <InfoCard label={t("vehicles.services")} value={String(vehicleServices.length)} icon={Wrench} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{t("vehicles.recentReceipts")}</p>
                      <Button size="sm" variant="outline" onClick={() => setReceiptVehicleId(vehicle.id)} className="gap-2">
                        <Plus className="h-4 w-4" /> {t("dashboard.addReceipt")}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {vehicleReceipts.slice(0, 3).map((receipt) => (
                        <div key={receipt.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-secondary/30 px-3 py-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{receipt.vendor}</p>
                            <p className="text-xs text-muted-foreground">{t(`category.${receipt.category}` as any)} · {format(parseISO(receipt.date), "MMM d, yyyy", { locale: dateLocale })}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold tabular-nums">{fmtMoney(receipt.amount)}</p>
                            {receipt.fuelLiters != null && <p className="text-xs text-muted-foreground">{receipt.fuelLiters.toFixed(1)} L</p>}
                          </div>
                        </div>
                      ))}
                      {vehicleReceipts.length === 0 && <p className="text-sm text-muted-foreground">{t("vehicles.noReceipts")}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{t("form.addVehicleTitle")}</DialogTitle>
            <DialogDescription>{t("form.addVehicleDesc")}</DialogDescription>
          </DialogHeader>
          <AddVehicleForm onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={vehicleToEdit !== null} onOpenChange={(isOpen) => !isOpen && setEditingVehicle(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{t("form.editVehicleTitle")}</DialogTitle>
            <DialogDescription>{t("form.editVehicleDesc")}</DialogDescription>
          </DialogHeader>
          {vehicleToEdit && <AddVehicleForm onClose={() => setEditingVehicle(null)} initialVehicle={vehicleToEdit} />}
        </DialogContent>
      </Dialog>

      <Dialog open={receiptVehicleId !== null} onOpenChange={(isOpen) => !isOpen && setReceiptVehicleId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {receiptVehicleId === "general" ? t("form.receipt.addTitle") : t("form.receipt.addVehicleTitle")}
            </DialogTitle>
            <DialogDescription>
              {receiptVehicleId === "general" ? t("form.receipt.addDesc") : t("form.receipt.addVehicleDesc")}
            </DialogDescription>
          </DialogHeader>
          <AddReceiptForm
            onClose={() => setReceiptVehicleId(null)}
            defaultVehicleId={receiptVehicleId && receiptVehicleId !== "general" ? receiptVehicleId : undefined}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingVehicle !== null} onOpenChange={(isOpen) => !isOpen && setDeletingVehicle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("vehicles.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {vehicleToDelete
                ? t("vehicles.delete.confirm", { receipts: deleteSummary?.receipts ?? 0, services: deleteSummary?.services ?? 0, brand: vehicleToDelete.brand, model: vehicleToDelete.model })
                : t("vehicles.delete.undone")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deletingVehicle) {
                  try {
                    await deleteVehicle(deletingVehicle);
                    toast({ title: t("common.delete"), description: t("activity.receiptToastDeleted") });
                  } catch (error) {
                    const message = formatAppError(error, t("validate.brandDesc"));
                    toast({ title: t("ocr.scanFailed"), description: message, variant: "destructive" });
                  }
                }
                setDeletingVehicle(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function InfoCard({ label, value, icon: Icon, subtext }: { label: string; value: string; icon: LucideIcon; subtext?: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/30 p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-1 font-display text-lg font-bold">{value}</p>
      {subtext && <p className="text-[11px] text-muted-foreground mt-0.5">{subtext}</p>}
    </div>
  );
}
