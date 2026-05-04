import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Car, Wrench, Receipt, BarChart3, Bell, Search, Menu, X, Plus, Settings, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/vehicles", label: "Vehicles", icon: Car },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/receipts", label: "Receipts", icon: Receipt },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function AppShell({ children, onQuickAdd }: { children: React.ReactNode; onQuickAdd?: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-30">
        <Brand />
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>
        <UpsellCard />
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar text-sidebar-foreground flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-5 pt-5">
              <Brand compact />
              <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => (
                <SidebarLink key={item.to} {...item} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>
            <UpsellCard />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="flex items-center gap-3 h-16 px-4 sm:px-6 lg:px-8">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search vehicles, services, receipts…"
                className="pl-9 h-10 bg-secondary/60 border-transparent focus-visible:bg-card focus-visible:border-border"
                aria-label="Search"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 ring-2 ring-background shadow-elev-sm">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">AM</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Alex Morgan</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Floating action button */}
      <button
        onClick={onQuickAdd}
        aria-label="Quick add"
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-gradient-primary text-primary-foreground shadow-glow hover:scale-105 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
      >
        <Plus className="h-6 w-6 mx-auto" />
      </button>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 px-5", compact ? "" : "h-16 border-b border-sidebar-border")}>
      <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
        <Car className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="leading-tight">
        <div className="font-display font-bold text-base text-white">GarageOS</div>
        <div className="text-[11px] text-sidebar-foreground/70">Maintenance & Expenses</div>
      </div>
    </div>
  );
}

function SidebarLink({ to, label, icon: Icon, end, onClick }: any) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-elev-sm relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-r-full before:bg-sidebar-primary"
            : "text-sidebar-foreground"
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

function UpsellCard() {
  return (
    <div className="m-3 p-4 rounded-xl bg-sidebar-accent/60 border border-sidebar-border">
      <div className="flex items-center gap-2 text-sidebar-primary mb-2">
        <Sparkles className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">Pro tip</span>
      </div>
      <p className="text-xs text-sidebar-foreground/80 leading-relaxed">
        Snap a photo of any receipt and we'll auto-categorize it for you.
      </p>
    </div>
  );
}
