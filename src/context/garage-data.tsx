import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { maintenance as initialMaintenance, receipts as initialReceipts, vehicles as initialVehicles, type Maintenance, type Receipt, type Vehicle } from "@/data/mockData";

type GarageDataValue = {
  vehicles: Vehicle[];
  receipts: Receipt[];
  maintenance: Maintenance[];
  addVehicle: (vehicle: Omit<Vehicle, "id">) => void;
  updateVehicle: (id: string, updates: Partial<Omit<Vehicle, "id">>) => void;
  deleteVehicle: (id: string) => void;
  addReceipt: (receipt: Omit<Receipt, "id">) => void;
  updateReceipt: (id: string, updates: Partial<Omit<Receipt, "id">>) => void;
  addMaintenance: (maintenance: Omit<Maintenance, "id">) => void;
  deleteReceipt: (id: string) => void;
  updateMaintenance: (id: string, updates: Partial<Maintenance>) => void;
  deleteMaintenance: (id: string) => void;
};

const STORAGE_KEYS = {
  vehicles: "steady-wheel-hub.vehicles",
  receipts: "steady-wheel-hub.receipts",
  maintenance: "steady-wheel-hub.maintenance",
};

const GarageDataContext = createContext<GarageDataValue | null>(null);

function loadList<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function makeId(prefix: string, size: number) {
  return `${prefix}-${Date.now()}-${size + 1}`;
}

export function GarageDataProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => loadList(STORAGE_KEYS.vehicles, initialVehicles));
  const [receipts, setReceipts] = useState<Receipt[]>(() => loadList(STORAGE_KEYS.receipts, initialReceipts));
  const [maintenance, setMaintenance] = useState<Maintenance[]>(() => loadList(STORAGE_KEYS.maintenance, initialMaintenance));

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.receipts, JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.maintenance, JSON.stringify(maintenance));
  }, [maintenance]);

  const value = useMemo<GarageDataValue>(() => ({
    vehicles,
    receipts,
    maintenance,
    addVehicle: (vehicle) => {
      setVehicles((current) => [...current, { id: makeId("v", current.length), ...vehicle }]);
    },
    updateVehicle: (id, updates) => {
      setVehicles((current) => current.map((vehicle) => (vehicle.id === id ? { ...vehicle, ...updates } : vehicle)));
    },
    deleteVehicle: (id) => {
      setVehicles((current) => current.filter((vehicle) => vehicle.id !== id));
      setReceipts((current) => current.filter((receipt) => receipt.vehicleId !== id));
      setMaintenance((current) => current.filter((entry) => entry.vehicleId !== id));
    },
    addReceipt: (receipt) => {
      setReceipts((current) => [...current, { id: makeId("r", current.length), ...receipt }]);
    },
    updateReceipt: (id, updates) => {
      setReceipts((current) => current.map((receipt) => (receipt.id === id ? { ...receipt, ...updates } : receipt)));
    },
    addMaintenance: (entry) => {
      setMaintenance((current) => [...current, { id: makeId("m", current.length), ...entry }]);
    },
    deleteReceipt: (id) => {
      setReceipts((current) => current.filter((r) => r.id !== id));
    },
    updateMaintenance: (id, updates) => {
      setMaintenance((current) =>
        current.map((m) => (m.id === id ? { ...m, ...updates } : m))
      );
    },
    deleteMaintenance: (id) => {
      setMaintenance((current) => current.filter((m) => m.id !== id));
    },
  }), [receipts, vehicles, maintenance]);

  return <GarageDataContext.Provider value={value}>{children}</GarageDataContext.Provider>;
}

export function useGarageData() {
  const value = useContext(GarageDataContext);

  if (!value) {
    throw new Error("useGarageData must be used within a GarageDataProvider");
  }

  return value;
}