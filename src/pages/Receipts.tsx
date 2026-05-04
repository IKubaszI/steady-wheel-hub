import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "./Vehicles";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddReceiptForm } from "@/components/forms/AddReceiptForm";
import { ReceiptList } from "@/components/receipts/ReceiptList";

export default function Receipts() {
  const [open, setOpen] = useState(false);
  return (
    <AppShell onQuickAdd={() => setOpen(true)}>
      <PageHeader
        title="Receipts & expenses"
        subtitle="Every dollar, organized by category"
        action={<Button onClick={() => setOpen(true)} className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"><Plus className="h-4 w-4" /> Add receipt</Button>}
      />
      <ReceiptList />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-xl">Add a receipt</DialogTitle><DialogDescription>Track a new car-related expense.</DialogDescription></DialogHeader>
          <AddReceiptForm onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
