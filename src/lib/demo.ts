import { getFirebaseDb } from "@/lib/firebase";
import type { Category, ServiceStatus } from "@/data/mockData";

export const DEMO_USER = {
  name: "Test",
  email: "testowy@test.pl",
  password: "Test123!",
} as const;

type DemoVehicle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  plate: string;
  color: string;
  nextService: string;
};

type DemoReceipt = {
  id: string;
  vehicleId: string;
  vendor: string;
  category: Category;
  amount: number;
  date: string;
  fuelLiters?: number;
  photos: string[];
};

type DemoMaintenance = {
  id: string;
  vehicleId: string;
  type: string;
  date: string;
  cost: number;
  status: ServiceStatus;
  notes: string;
};

const demoVehicles: DemoVehicle[] = [
  { id: "demo-v1", brand: "Skoda", model: "Octavia", year: 2021, mileage: 64500, plate: "DW 1234A", color: "Graphite", nextService: "2026-06-15" },
  { id: "demo-v2", brand: "Toyota", model: "Corolla", year: 2020, mileage: 78200, plate: "KR 92P4", color: "White Pearl", nextService: "2026-05-28" },
];

const demoReceipts: DemoReceipt[] = [
  {
    id: "demo-r1",
    vehicleId: "demo-v1",
    vendor: "Orlen Wroclaw",
    category: "fuel",
    amount: 286.4,
    date: "2026-04-18",
    fuelLiters: 46.2,
    photos: ["/receipt-1.png"],
  },
  {
    id: "demo-r2",
    vehicleId: "demo-v1",
    vendor: "Inter Cars",
    category: "parts",
    amount: 429.99,
    date: "2026-03-21",
    photos: ["/receipt-2.png"],
  },
  {
    id: "demo-r3",
    vehicleId: "demo-v2",
    vendor: "PZU",
    category: "insurance",
    amount: 920,
    date: "2026-02-10",
    photos: ["/receipt-3.png"],
  },
  {
    id: "demo-r4",
    vehicleId: "demo-v2",
    vendor: "Bosch Service",
    category: "service",
    amount: 560,
    date: "2026-04-05",
    photos: ["/receipt-4.png"],
  },
];

const demoMaintenance: DemoMaintenance[] = [
  {
    id: "demo-m1",
    vehicleId: "demo-v1",
    type: "Oil and filter change",
    date: "2026-04-25",
    cost: 220,
    status: "completed",
    notes: "5W30 synthetic oil.",
  },
  {
    id: "demo-m2",
    vehicleId: "demo-v1",
    type: "Brake fluid replacement",
    date: "2026-05-30",
    cost: 190,
    status: "upcoming",
    notes: "Scheduled next month.",
  },
  {
    id: "demo-m3",
    vehicleId: "demo-v2",
    type: "Tire rotation",
    date: "2026-05-02",
    cost: 120,
    status: "overdue",
    notes: "Rotate front and rear axle sets.",
  },
];

export async function seedDemoDataIfEmpty(userId: string) {
  // Funkcje Firestore pochodzą z `dbMod` (leniwy chunk firebase), więc demo.ts
  // nie ma statycznego importu z "firebase/firestore" — Firebase ładuje się
  // dopiero, gdy faktycznie seedujemy dane w trybie skonfigurowanym.
  const { db, dbMod } = await getFirebaseDb();
  const vehiclesRef = dbMod.collection(db, "users", userId, "vehicles");
  const vehiclesSnapshot = await dbMod.getDocs(dbMod.query(vehiclesRef, dbMod.limit(1)));
  if (!vehiclesSnapshot.empty) {
    return false;
  }

  await Promise.all([
    ...demoVehicles.map((vehicle) =>
      dbMod.setDoc(dbMod.doc(db, "users", userId, "vehicles", vehicle.id), {
        ...vehicle,
        createdAt: Date.now(),
      })
    ),
    ...demoReceipts.map((receipt) =>
      dbMod.setDoc(dbMod.doc(db, "users", userId, "receipts", receipt.id), {
        ...receipt,
        createdAt: Date.now(),
      })
    ),
    ...demoMaintenance.map((entry) =>
      dbMod.setDoc(dbMod.doc(db, "users", userId, "maintenance", entry.id), {
        ...entry,
        createdAt: Date.now(),
      })
    ),
  ]);

  return true;
}
