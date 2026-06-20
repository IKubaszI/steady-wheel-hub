import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "./Vehicles";
import { Button } from "@/components/ui/button";
import { Plus, Camera } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddReceiptForm } from "@/components/forms/AddReceiptForm";
import { ReceiptList } from "@/components/receipts/ReceiptList";
import { Link } from "react-router-dom";
import { type Category } from "@/data/mockData";
import { useGarageData } from "@/context/garage-data";
import { useSettings } from "@/context/settings";

export default function Receipts() {
  const [open, setOpen] = useState<null | { mode: "add"; category?: Category } | { mode: "edit"; receiptId: string }>(null);
  const { receipts } = useGarageData();
  const { t } = useSettings();
  const receiptToEdit = open?.mode === "edit" ? receipts.find((receipt) => receipt.id === open.receiptId) ?? null : null;

  return (
    <AppShell onQuickAdd={() => setOpen({ mode: "add" })}>
      <PageHeader
        title={t("receipts.title")}
        subtitle={t("receipts.subtitle")}
        action={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild className="gap-2">
              <Link to="/receipt-photos"><Camera className="h-4 w-4" /> {t("receipts.receiptPhotos")}</Link>
            </Button>
            <Button onClick={() => setOpen({ mode: "add" })} className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
              <Plus className="h-4 w-4" /> {t("dashboard.addReceipt")}
            </Button>
          </div>
        )}
      />
      <ReceiptList
        onAddReceipt={(category) => setOpen({ mode: "add", category })}
        onEditReceipt={(receiptId) => setOpen({ mode: "edit", receiptId })}
      />
      <Dialog open={open !== null} onOpenChange={(isOpen) => !isOpen && setOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {open?.mode === "edit"
                ? t("form.receipt.editTitle")
                : open?.category
                  ? t(`receipts.add${open.category.charAt(0).toUpperCase() + open.category.slice(1)}Receipt` as any)
                  : t("form.receipt.addTitle")}
            </DialogTitle>
            <DialogDescription>
              {open?.mode === "edit"
                ? t("form.receipt.editDesc")
                : t("form.receipt.addDesc")}
            </DialogDescription>
          </DialogHeader>
          <AddReceiptForm
            onClose={() => setOpen(null)}
            defaultCategory={open?.mode === "add" ? open.category : undefined}
            initialReceipt={receiptToEdit ?? undefined}
          />
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
