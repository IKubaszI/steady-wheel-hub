import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "./Vehicles";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddMaintenanceForm } from "@/components/forms/AddMaintenanceForm";
import { MaintenanceTimeline } from "@/components/maintenance/MaintenanceTimeline";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { maintenance, type ServiceStatus } from "@/data/mockData";

export default function MaintenancePage() {
  const [open, setOpen] = useState(false);
  const counts = maintenance.reduce((acc, m) => { acc[m.status] = (acc[m.status] || 0) + 1; return acc; }, {} as Record<ServiceStatus, number>);

  return (
    <AppShell onQuickAdd={() => setOpen(true)}>
      <PageHeader
        title="Maintenance history"
        subtitle="Every service across your fleet"
        action={<Button onClick={() => setOpen(true)} className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"><Plus className="h-4 w-4" /> Log service</Button>}
      />

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-secondary/60">
          <TabsTrigger value="all">All ({maintenance.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({counts.upcoming || 0})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({counts.overdue || 0})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({counts.completed || 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="all"><MaintenanceTimeline /></TabsContent>
        <TabsContent value="upcoming"><MaintenanceTimeline /></TabsContent>
        <TabsContent value="overdue"><MaintenanceTimeline /></TabsContent>
        <TabsContent value="completed"><MaintenanceTimeline /></TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-xl">Log a maintenance service</DialogTitle><DialogDescription>Record a completed or upcoming service.</DialogDescription></DialogHeader>
          <AddMaintenanceForm onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
