import { Fuel, Wrench, ShieldCheck, Cog, MoreHorizontal, type LucideIcon } from "lucide-react";

export type Category = "fuel" | "parts" | "service" | "insurance" | "other";

export const categoryMeta: Record<Category, { label: string; icon: LucideIcon; color: string; bg: string; ring: string }> = {
  fuel:      { label: "Fuel",      icon: Fuel,            color: "hsl(var(--cat-fuel))",      bg: "bg-[hsl(var(--cat-fuel)/0.12)] text-[hsl(var(--cat-fuel))]",       ring: "ring-[hsl(var(--cat-fuel)/0.3)]" },
  parts:     { label: "Parts",     icon: Cog,             color: "hsl(var(--cat-parts))",     bg: "bg-[hsl(var(--cat-parts)/0.12)] text-[hsl(var(--cat-parts))]",     ring: "ring-[hsl(var(--cat-parts)/0.3)]" },
  service:   { label: "Service",   icon: Wrench,          color: "hsl(var(--cat-service))",   bg: "bg-[hsl(var(--cat-service)/0.12)] text-[hsl(var(--cat-service))]", ring: "ring-[hsl(var(--cat-service)/0.3)]" },
  insurance: { label: "Insurance", icon: ShieldCheck,     color: "hsl(var(--cat-insurance))", bg: "bg-[hsl(var(--cat-insurance)/0.12)] text-[hsl(var(--cat-insurance))]", ring: "ring-[hsl(var(--cat-insurance)/0.3)]" },
  other:     { label: "Other",     icon: MoreHorizontal,  color: "hsl(var(--cat-other))",     bg: "bg-[hsl(var(--cat-other)/0.12)] text-[hsl(var(--cat-other))]",     ring: "ring-[hsl(var(--cat-other)/0.3)]" },
};

export type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  plate: string;
  color: string;
  nextService: string;
  fuelLitersTotal?: number;
  image?: string;       // background photo (data URL or URL)
  logoUrl?: string;     // brand logo override
  theme?: string;       // visual theme key for card customization
  pattern?: string;     // background pattern key
};

export const vehicles: Vehicle[] = [
  { id: "v1", brand: "Tesla",   model: "Model 3 Long Range", year: 2022, mileage: 41250, plate: "TS-3204", color: "Pearl White", nextService: "2026-06-12" },
  { id: "v2", brand: "Toyota",  model: "RAV4 Hybrid",        year: 2021, mileage: 58900, plate: "TY-8821", color: "Magnetic Gray", nextService: "2026-05-21" },
  { id: "v3", brand: "BMW",     model: "M340i xDrive",       year: 2023, mileage: 22480, plate: "BM-1140", color: "Alpine White", nextService: "2026-07-04" },
  { id: "v4", brand: "Ford",    model: "F-150 Lariat",       year: 2020, mileage: 87340, plate: "FD-7710", color: "Race Red",     nextService: "2026-05-09" },
];

export type ServiceStatus = "completed" | "upcoming" | "overdue";
export type Maintenance = {
  id: string;
  vehicleId: string;
  type: string;
  date: string;
  cost: number;
  status: ServiceStatus;
  notes: string;
};

export const maintenance: Maintenance[] = [
  { id: "m1", vehicleId: "v2", type: "Oil & Filter Change",  date: "2026-05-09", cost: 89.50,  status: "overdue",   notes: "Synthetic 5W-30, replace cabin filter." },
  { id: "m2", vehicleId: "v1", type: "Tire Rotation",        date: "2026-05-12", cost: 45.00,  status: "upcoming",  notes: "Check tread depth on rear tires." },
  { id: "m3", vehicleId: "v3", type: "Brake Pad Replacement",date: "2026-04-28", cost: 412.00, status: "completed", notes: "Front pads replaced, rotors resurfaced." },
  { id: "m4", vehicleId: "v4", type: "Annual Inspection",    date: "2026-04-22", cost: 75.00,  status: "completed", notes: "Passed. Recommended new wipers." },
  { id: "m5", vehicleId: "v2", type: "Coolant Flush",        date: "2026-04-10", cost: 130.00, status: "completed", notes: "Long-life coolant used." },
  { id: "m6", vehicleId: "v1", type: "Software Update",      date: "2026-05-18", cost: 0,      status: "upcoming",  notes: "OTA scheduled — autopilot improvements." },
  { id: "m7", vehicleId: "v3", type: "Wheel Alignment",      date: "2026-03-30", cost: 110.00, status: "completed", notes: "Pulling slightly to the right resolved." },
];

export type Receipt = {
  id: string;
  vehicleId: string;
  vendor: string;
  category: Category;
  amount: number;
  date: string;
  fuelLiters?: number;
  photos: string[];
};

export const receipts: Receipt[] = [
  { id: "r1",  vehicleId: "v1", vendor: "Supercharger Station", category: "fuel",      amount: 24.30, date: "2026-05-02", fuelLiters: 7.8,  photos: ["/receipt-1.png"] },
  { id: "r2",  vehicleId: "v2", vendor: "Shell Premium",        category: "fuel",      amount: 62.80, date: "2026-05-01", fuelLiters: 31.4, photos: ["/receipt-2.png"] },
  { id: "r3",  vehicleId: "v3", vendor: "BMW Dealer Parts",     category: "parts",     amount: 318.40, date: "2026-04-28", photos: ["/receipt-3.png", "/receipt-4.png"] },
  { id: "r4",  vehicleId: "v4", vendor: "Mike's Auto Service",  category: "service",   amount: 240.00, date: "2026-04-22", photos: ["/receipt-4.png"] },
  { id: "r5",  vehicleId: "v1", vendor: "GEICO",                category: "insurance", amount: 162.00, date: "2026-04-15", photos: [] },
  { id: "r6",  vehicleId: "v2", vendor: "AutoZone",             category: "parts",     amount: 84.20,  date: "2026-04-12", photos: ["/receipt-1.png"] },
  { id: "r7",  vehicleId: "v3", vendor: "Detail Pros",          category: "other",     amount: 220.00, date: "2026-04-09", photos: ["/receipt-2.png"] },
  { id: "r8",  vehicleId: "v4", vendor: "Costco Gas",           category: "fuel",      amount: 71.10,  date: "2026-04-05", fuelLiters: 34.8, photos: ["/receipt-3.png"] },
  { id: "r9",  vehicleId: "v2", vendor: "Allstate",             category: "insurance", amount: 148.00, date: "2026-03-28", photos: [] },
  { id: "r10", vehicleId: "v3", vendor: "Quick Lube",           category: "service",   amount: 95.50,  date: "2026-03-21", photos: ["/receipt-4.png"] },
  { id: "r11", vehicleId: "v1", vendor: "Tire Rack",            category: "parts",     amount: 612.00, date: "2026-03-12", photos: ["/receipt-1.png", "/receipt-2.png"] },
  { id: "r12", vehicleId: "v4", vendor: "Shell Premium",        category: "fuel",      amount: 78.40,  date: "2026-03-04", fuelLiters: 39.1, photos: ["/receipt-3.png"] },
];

export const monthlyExpenses = [
  { month: "Nov", value: 540 },
  { month: "Dec", value: 720 },
  { month: "Jan", value: 410 },
  { month: "Feb", value: 980 },
  { month: "Mar", value: 1180 },
  { month: "Apr", value: 1342 },
  { month: "May", value: 86 },
];
