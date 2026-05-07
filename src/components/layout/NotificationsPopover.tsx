import { Bell, AlertTriangle, Clock, CheckCircle2, BellRing, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGarageData } from "@/context/garage-data";
import { differenceInDays, format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getNotificationPermission, notifyOnce, requestNotificationPermission, type Permission } from "@/lib/browser-notifications";
import { toast } from "sonner";

export function NotificationsPopover() {
  const { maintenance, vehicles } = useGarageData();
  const navigate = useNavigate();
  const [perm, setPerm] = useState<Permission>("default");

  useEffect(() => { setPerm(getNotificationPermission()); }, []);

  const items = useMemo(() => {
    return maintenance
      .filter((m) => m.status !== "completed")
      .sort((a, b) => +parseISO(a.date) - +parseISO(b.date))
      .slice(0, 6)
      .map((m) => {
        const v = vehicles.find((x) => x.id === m.vehicleId);
        const days = differenceInDays(parseISO(m.date), new Date());
        return { ...m, vehicle: v, days };
      });
  }, [maintenance, vehicles]);

  const unread = items.filter((i) => i.status === "overdue").length;

  // Fire browser notifications for overdue + upcoming within 3 days
  useEffect(() => {
    if (perm !== "granted") return;
    items.forEach((m) => {
      if (m.status === "overdue") {
        notifyOnce(`overdue:${m.id}`, "Service overdue", {
          body: `${m.type} — ${m.vehicle?.brand ?? ""} ${m.vehicle?.model ?? ""}`.trim(),
          icon: "/favicon.ico",
          tag: `overdue-${m.id}`,
        });
      } else if (m.status === "upcoming" && m.days >= 0 && m.days <= 3) {
        notifyOnce(`upcoming:${m.id}:${m.days}`, "Upcoming service", {
          body: `${m.type} in ${m.days}d — ${m.vehicle?.brand ?? ""} ${m.vehicle?.model ?? ""}`.trim(),
          icon: "/favicon.ico",
          tag: `upcoming-${m.id}`,
        });
      }
    });
  }, [items, perm]);

  const enable = async () => {
    const res = await requestNotificationPermission();
    setPerm(res);
    if (res === "granted") toast.success("Browser notifications enabled");
    else if (res === "denied") toast.error("Notifications blocked in browser settings");
    else if (res === "unsupported") toast.error("Notifications not supported in this browser");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold grid place-items-center animate-scale-in">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Notifications</p>
            <p className="text-xs text-muted-foreground">{items.length} pending services</p>
          </div>
          {perm === "granted" ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success"><BellRing className="h-3.5 w-3.5" /> On</span>
          ) : perm === "denied" ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive"><BellOff className="h-3.5 w-3.5" /> Blocked</span>
          ) : (
            <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={enable}>Enable</Button>
          )}
        </div>
        <ul className="max-h-80 overflow-auto divide-y divide-border">
          {items.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-success" />
              All caught up!
            </li>
          )}
          {items.map((m) => {
            const Icon = m.status === "overdue" ? AlertTriangle : Clock;
            const tone = m.status === "overdue" ? "text-destructive bg-destructive/10" : "text-primary bg-primary/10";
            return (
              <li key={m.id}>
                <button
                  onClick={() => navigate("/maintenance")}
                  className="w-full text-left px-4 py-3 hover:bg-secondary/60 transition-colors flex items-start gap-3"
                >
                  <div className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 ${tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{m.type}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {m.vehicle?.brand} {m.vehicle?.model} · {format(parseISO(m.date), "MMM d")}
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold ${m.status === "overdue" ? "text-destructive" : "text-primary"}`}>
                    {m.status === "overdue" ? "Overdue" : `in ${m.days}d`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="p-2 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate("/maintenance")}>View all</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}