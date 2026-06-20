import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "./Vehicles";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddMaintenanceForm } from "@/components/forms/AddMaintenanceForm";
import { MaintenanceTimeline } from "@/components/maintenance/MaintenanceTimeline";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { type ServiceStatus } from "@/data/mockData";
import { useGarageData } from "@/context/garage-data";
import { useSettings } from "@/context/settings";

export default function MaintenancePage() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | ServiceStatus>("all");
  const { maintenance } = useGarageData();
  const { t } = useSettings();
  const counts = maintenance.reduce((acc, m) => { acc[m.status] = (acc[m.status] || 0) + 1; return acc; }, {} as Record<ServiceStatus, number>);

  return (
    <AppShell onQuickAdd={() => setOpen(true)}>
      <PageHeader
        title={t("maintenance.title")}
        subtitle={t("maintenance.subtitle")}
        action={<Button onClick={() => setOpen(true)} className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"><Plus className="h-4 w-4" /> {t("form.service.addEntry")}</Button>}
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as "all" | ServiceStatus)} className="space-y-6">
        <TabsList className="bg-secondary/60">
          <TabsTrigger value="all">{t("common.all")} ({maintenance.length})</TabsTrigger>
          <TabsTrigger value="upcoming">{t("status.upcoming")} ({counts.upcoming || 0})</TabsTrigger>
          <TabsTrigger value="overdue">{t("status.overdue")} ({counts.overdue || 0})</TabsTrigger>
          <TabsTrigger value="completed">{t("status.completed")} ({counts.completed || 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="all"><MaintenanceTimeline status={tab} /></TabsContent>
        <TabsContent value="upcoming"><MaintenanceTimeline status={tab} /></TabsContent>
        <TabsContent value="overdue"><MaintenanceTimeline status={tab} /></TabsContent>
        <TabsContent value="completed"><MaintenanceTimeline status={tab} /></TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-xl">{t("form.service.logTitle")}</DialogTitle><DialogDescription>{t("form.service.logDesc")}</DialogDescription></DialogHeader>
          <AddMaintenanceForm onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
