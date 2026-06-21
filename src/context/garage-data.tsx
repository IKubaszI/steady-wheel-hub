import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import {
  maintenance as initialMaintenance,
  receipts as initialReceipts,
  vehicles as initialVehicles,
  defaultChecklist,
  type Maintenance,
  type Receipt,
  type Vehicle,
  type ChecklistItem,
} from "@/data/mockData";
import { useAuth } from "@/context/auth";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  MAX_RECEIPT_FILE_SIZE_BYTES,
  MAX_RECEIPT_FILES,
  maintenanceInputSchema,
  receiptInputSchema,
  vehicleInputSchema,
} from "@/lib/schemas";
import { uploadImage } from "@/services/cloudinaryService";
import { compressImageIfNeeded } from "@/lib/image";

type GarageDataValue = {
  vehicles: Vehicle[];
  receipts: Receipt[];
  maintenance: Maintenance[];
  addVehicle: (vehicle: Omit<Vehicle, "id">) => Promise<void>;
  updateVehicle: (id: string, updates: Partial<Omit<Vehicle, "id">>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  addReceipt: (receipt: Omit<Receipt, "id">, files?: File[]) => Promise<void>;
  updateReceipt: (id: string, updates: Partial<Omit<Receipt, "id">>, files?: File[]) => Promise<void>;
  addMaintenance: (maintenance: Omit<Maintenance, "id">) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
  updateMaintenance: (id: string, updates: Partial<Maintenance>) => Promise<void>;
  deleteMaintenance: (id: string) => Promise<void>;
  checklist: ChecklistItem[];
  toggleChecklistItem: (id: string, checked: number) => Promise<void>;
  addChecklistItem: (category: string, text: string) => Promise<void>;
  deleteChecklistItem: (id: string) => Promise<void>;
  resetChecklist: () => Promise<void>;
};

const GarageDataContext = createContext<GarageDataValue | null>(null);
const DEMO_DATA_KEY = "steadywheelhub.demoData";

function removeUndefinedFields<T extends Record<string, unknown>>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  ) as T;
}

function readDemoData() {
  try {
    const stored = window.localStorage.getItem(DEMO_DATA_KEY);
    if (stored) {
      return JSON.parse(stored) as { vehicles: Vehicle[]; receipts: Receipt[]; maintenance: Maintenance[] };
    }
  } catch {
    window.localStorage.removeItem(DEMO_DATA_KEY);
  }
  return { vehicles: initialVehicles, receipts: initialReceipts, maintenance: initialMaintenance };
}

function saveDemoData(next: { vehicles: Vehicle[]; receipts: Receipt[]; maintenance: Maintenance[] }) {
  window.localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(next));
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

function readLocalChecklist(): ChecklistItem[] {
  try {
    const stored = window.localStorage.getItem("steadywheelhub.checklist");
    if (stored) {
      return JSON.parse(stored) as ChecklistItem[];
    }
  } catch {
    window.localStorage.removeItem("steadywheelhub.checklist");
  }
  const initial = defaultChecklist.map((item, idx) => ({
    id: `local-c-${idx}-${crypto.randomUUID()}`,
    ...item,
  }));
  window.localStorage.setItem("steadywheelhub.checklist", JSON.stringify(initial));
  return initial;
}

function saveLocalChecklist(list: ChecklistItem[]) {
  window.localStorage.setItem("steadywheelhub.checklist", JSON.stringify(list));
}

export function GarageDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
  const [maintenance, setMaintenance] = useState<Maintenance[]>(initialMaintenance);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  function assertFiles(files: File[]) {
    if (files.length > MAX_RECEIPT_FILES) {
      throw new Error(`You can upload up to ${MAX_RECEIPT_FILES} files.`);
    }
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        throw new Error("Only image files are allowed.");
      }
      if (file.size > MAX_RECEIPT_FILE_SIZE_BYTES) {
        throw new Error("One of the files exceeds the 15MB limit.");
      }
    });
  }

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    let checklistSeeding = false;

    if (!isFirebaseConfigured) {
      if (!user) {
        setVehicles([]);
        setReceipts([]);
        setMaintenance([]);
        return () => {
          cancelled = true;
        };
      }

      const demoData = readDemoData();
      setVehicles(demoData.vehicles);
      setReceipts(demoData.receipts);
      setMaintenance(demoData.maintenance);
      setChecklist(readLocalChecklist());
      return () => {
        cancelled = true;
      };
    }

    if (!user) {
      setVehicles([]);
      setReceipts([]);
      setMaintenance([]);
      setChecklist([]);
      return () => {
        cancelled = true;
      };
    }

    const initListeners = async () => {
      try {
        await user.getIdToken();

        if (cancelled) {
          return;
        }

        const vehiclesQuery = query(
          collection(db, "users", user.uid, "vehicles"),
          orderBy("createdAt", "desc")
        );
        const receiptsQuery = query(
          collection(db, "users", user.uid, "receipts"),
          orderBy("date", "desc")
        );
        const maintenanceQuery = query(
          collection(db, "users", user.uid, "maintenance"),
          orderBy("date", "desc")
        );

        const checklistQuery = query(
          collection(db, "users", user.uid, "checklist"),
          orderBy("createdAt", "asc")
        );

        const unsubChecklist = onSnapshot(
          checklistQuery,
          async (snapshot) => {
            const items = snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...(docItem.data() as Omit<ChecklistItem, "id">),
            }));
            if (items.length === 0 && !checklistSeeding) {
              checklistSeeding = true;
              try {
                const collRef = collection(db, "users", user.uid, "checklist");
                for (const item of defaultChecklist) {
                  await addDoc(collRef, item);
                }
              } catch (err) {
                console.error("Error seeding checklist:", err);
                // Fallback to local storage on seeding failure (e.g. permission denied)
                setChecklist(readLocalChecklist());
              } finally {
                checklistSeeding = false;
              }
            } else {
              setChecklist(items);
            }
          },
          (error) => {
            console.error("Checklist listener error:", error);
            // Fallback to local storage on listener failure
            setChecklist(readLocalChecklist());
          }
        );

        const unsubs = [
          onSnapshot(
            vehiclesQuery,
            (snapshot) => {
          setVehicles(
            snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...(docItem.data() as Omit<Vehicle, "id">),
            }))
          );
            },
            (error) => {
          console.error("Vehicles listener error:", error);
            }
          ),
          onSnapshot(
            receiptsQuery,
            (snapshot) => {
          setReceipts(
            snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...(docItem.data() as Omit<Receipt, "id">),
            }))
          );
            },
            (error) => {
          console.error("Receipts listener error:", error);
            }
          ),
          onSnapshot(
            maintenanceQuery,
            (snapshot) => {
          setMaintenance(
            snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...(docItem.data() as Omit<Maintenance, "id">),
            }))
          );
            },
            (error) => {
          console.error("Maintenance listener error:", error);
            }
          ),
          unsubChecklist,
        ];

        cleanup = () => {
          unsubs.forEach((unsub) => unsub());
        };
      } catch (error) {
        console.error("Failed to initialize Firestore listeners:", error);
      }
    };

    initListeners();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [user]);

  const value = useMemo<GarageDataValue>(() => ({
    vehicles,
    receipts,
    maintenance,
    addVehicle: async (vehicle) => {
      if (!isFirebaseConfigured) {
        const safeVehicle = vehicleInputSchema.parse(vehicle) as Omit<Vehicle, "id">;
        const nextVehicle: Vehicle = { id: `local-v-${crypto.randomUUID()}`, ...safeVehicle };
        const nextVehicles: Vehicle[] = [nextVehicle, ...vehicles];
        setVehicles(nextVehicles);
        saveDemoData({ vehicles: nextVehicles, receipts, maintenance });
        return;
      }
      if (!user) {
        throw new Error("You must be logged in to add a vehicle.");
      }
      const safeVehicle = vehicleInputSchema.parse(vehicle);
      await addDoc(collection(db, "users", user.uid, "vehicles"), {
        ...safeVehicle,
        createdAt: Date.now(),
      });
    },
    updateVehicle: async (id, updates) => {
      if (!isFirebaseConfigured) {
        const safeUpdates = vehicleInputSchema.partial().parse(updates) as Partial<Omit<Vehicle, "id">>;
        const nextVehicles: Vehicle[] = vehicles.map((vehicle) => vehicle.id === id ? { ...vehicle, ...safeUpdates } : vehicle);
        setVehicles(nextVehicles);
        saveDemoData({ vehicles: nextVehicles, receipts, maintenance });
        return;
      }
      if (!user) {
        throw new Error("You must be logged in to update a vehicle.");
      }
      const current = vehicles.find((vehicle) => vehicle.id === id);
      if (!current) {
        return;
      }
      const safeUpdates = vehicleInputSchema.partial().parse(updates);
      await updateDoc(doc(db, "users", user.uid, "vehicles", id), safeUpdates);
    },
    deleteVehicle: async (id) => {
      if (!isFirebaseConfigured) {
        const nextVehicles = vehicles.filter((vehicle) => vehicle.id !== id);
        const nextReceipts = receipts.filter((item) => item.vehicleId !== id);
        const nextMaintenance = maintenance.filter((item) => item.vehicleId !== id);
        setVehicles(nextVehicles);
        setReceipts(nextReceipts);
        setMaintenance(nextMaintenance);
        saveDemoData({ vehicles: nextVehicles, receipts: nextReceipts, maintenance: nextMaintenance });
        return;
      }
      if (!user) {
        throw new Error("You must be logged in to delete a vehicle.");
      }
      await deleteDoc(doc(db, "users", user.uid, "vehicles", id));
      const linkedReceipts = receipts.filter((item) => item.vehicleId === id);
      const linkedMaintenance = maintenance.filter((item) => item.vehicleId === id);
      await Promise.all([
        ...linkedReceipts.map((item) => deleteDoc(doc(db, "users", user.uid, "receipts", item.id))),
        ...linkedMaintenance.map((item) => deleteDoc(doc(db, "users", user.uid, "maintenance", item.id))),
      ]);
    },
    addReceipt: async (receipt, files = []) => {
      if (!isFirebaseConfigured) {
        assertFiles(files);
        const preparedFiles = await Promise.all(files.map((file) => compressImageIfNeeded(file)));
        const uploadedUrls = await Promise.all(preparedFiles.map((file) => fileToDataUrl(file)));
        const safeReceipt = receiptInputSchema.parse({
          ...receipt,
          photos: [...receipt.photos, ...uploadedUrls],
        }) as Omit<Receipt, "id">;
        const nextReceipt: Receipt = { id: `local-r-${crypto.randomUUID()}`, ...safeReceipt };
        const nextReceipts = [nextReceipt, ...receipts];
        setReceipts(nextReceipts);
        saveDemoData({ vehicles, receipts: nextReceipts, maintenance });
        return;
      }
      if (!user) {
        throw new Error("You must be logged in to add a receipt.");
      }
      assertFiles(files);
      const preparedFiles = await Promise.all(files.map((file) => compressImageIfNeeded(file)));

      const uploadedUrls = await Promise.all(
        preparedFiles.map(async (file) => {
          const result = await uploadImage(file);
          return result.secureUrl;
        })
      );

      const safeReceipt = receiptInputSchema.parse({
        ...receipt,
        photos: [...receipt.photos, ...uploadedUrls],
      });

      await addDoc(collection(db, "users", user.uid, "receipts"), {
        ...removeUndefinedFields(safeReceipt),
        createdAt: Date.now(),
      });
    },
    updateReceipt: async (id, updates, files = []) => {
      const existing = receipts.find((receipt) => receipt.id === id);
      if (!existing) {
        return;
      }

      assertFiles(files);
      const preparedFiles = await Promise.all(files.map((file) => compressImageIfNeeded(file)));

      if (!isFirebaseConfigured) {
        const uploadedUrls = await Promise.all(preparedFiles.map((file) => fileToDataUrl(file)));
        const merged = {
          ...existing,
          ...updates,
          photos: [...(updates.photos ?? existing.photos), ...uploadedUrls],
        };
        const safeReceipt = receiptInputSchema.parse({
          vehicleId: merged.vehicleId,
          vendor: merged.vendor,
          category: merged.category,
          amount: merged.amount,
          date: merged.date,
          fuelLiters: merged.fuelLiters,
          photos: merged.photos,
        }) as Omit<Receipt, "id">;
        const nextReceipts = receipts.map((receiptItem) => receiptItem.id === id ? { id, ...safeReceipt } : receiptItem);
        setReceipts(nextReceipts);
        saveDemoData({ vehicles, receipts: nextReceipts, maintenance });
        return;
      }

      if (!user) {
        throw new Error("You must be logged in to update a receipt.");
      }

      const uploadedUrls = await Promise.all(
        preparedFiles.map(async (file) => {
          const result = await uploadImage(file);
          return result.secureUrl;
        })
      );

      const merged = {
        ...existing,
        ...updates,
        photos: [...(updates.photos ?? existing.photos), ...uploadedUrls],
      };
      const safeReceipt = receiptInputSchema.parse({
        vehicleId: merged.vehicleId,
        vendor: merged.vendor,
        category: merged.category,
        amount: merged.amount,
        date: merged.date,
        fuelLiters: merged.fuelLiters,
        photos: merged.photos,
      });
      await updateDoc(doc(db, "users", user.uid, "receipts", id), removeUndefinedFields(safeReceipt));
    },
    addMaintenance: async (entry) => {
      if (!isFirebaseConfigured) {
        const safeEntry = maintenanceInputSchema.parse(entry) as Omit<Maintenance, "id">;
        const nextEntry: Maintenance = { id: `local-m-${crypto.randomUUID()}`, ...safeEntry };
        const nextMaintenance = [nextEntry, ...maintenance];
        setMaintenance(nextMaintenance);
        saveDemoData({ vehicles, receipts, maintenance: nextMaintenance });
        return;
      }
      if (!user) {
        throw new Error("You must be logged in to add maintenance.");
      }
      const safeEntry = maintenanceInputSchema.parse(entry);
      await addDoc(collection(db, "users", user.uid, "maintenance"), {
        ...safeEntry,
        createdAt: Date.now(),
      });
    },
    deleteReceipt: async (id) => {
      if (!isFirebaseConfigured) {
        const nextReceipts = receipts.filter((receipt) => receipt.id !== id);
        setReceipts(nextReceipts);
        saveDemoData({ vehicles, receipts: nextReceipts, maintenance });
        return;
      }
      if (!user) {
        throw new Error("You must be logged in to delete a receipt.");
      }
      await deleteDoc(doc(db, "users", user.uid, "receipts", id));
    },
    updateMaintenance: async (id, updates) => {
      if (!isFirebaseConfigured) {
        const safeUpdates = maintenanceInputSchema.partial().parse(updates) as Partial<Omit<Maintenance, "id">>;
        const nextMaintenance = maintenance.map((entry) => entry.id === id ? { ...entry, ...safeUpdates } : entry);
        setMaintenance(nextMaintenance);
        saveDemoData({ vehicles, receipts, maintenance: nextMaintenance });
        return;
      }
      if (!user) {
        throw new Error("You must be logged in to update maintenance.");
      }
      const safeUpdates = maintenanceInputSchema.partial().parse(updates);
      await updateDoc(doc(db, "users", user.uid, "maintenance", id), safeUpdates);
    },
    deleteMaintenance: async (id) => {
      if (!isFirebaseConfigured) {
        const nextMaintenance = maintenance.filter((entry) => entry.id !== id);
        setMaintenance(nextMaintenance);
        saveDemoData({ vehicles, receipts, maintenance: nextMaintenance });
        return;
      }
      if (!user) {
        throw new Error("You must be logged in to delete maintenance.");
      }
      await deleteDoc(doc(db, "users", user.uid, "maintenance", id));
    },
    checklist,
    toggleChecklistItem: async (id, checked) => {
      try {
        if (!isFirebaseConfigured || id.startsWith("local-")) {
          throw new Error("use-local");
        }
        if (!user) {
          throw new Error("You must be logged in to update checklist.");
        }
        await updateDoc(doc(db, "users", user.uid, "checklist", id), { checked });
      } catch (err) {
        const nextList = checklist.map((item) => item.id === id ? { ...item, checked } : item);
        setChecklist(nextList);
        saveLocalChecklist(nextList);
      }
    },
    addChecklistItem: async (category, text) => {
      try {
        if (!isFirebaseConfigured) {
          throw new Error("use-local");
        }
        if (!user) {
          throw new Error("You must be logged in to add checklist item.");
        }
        await addDoc(collection(db, "users", user.uid, "checklist"), {
          text,
          category,
          checked: 0,
          createdAt: Date.now(),
        });
      } catch (err) {
        const newItem: ChecklistItem = {
          id: `local-c-${crypto.randomUUID()}`,
          text,
          category,
          checked: 0,
          createdAt: Date.now(),
        };
        const nextList = [...checklist, newItem];
        setChecklist(nextList);
        saveLocalChecklist(nextList);
      }
    },
    deleteChecklistItem: async (id) => {
      try {
        if (!isFirebaseConfigured || id.startsWith("local-")) {
          throw new Error("use-local");
        }
        if (!user) {
          throw new Error("You must be logged in to delete checklist item.");
        }
        await deleteDoc(doc(db, "users", user.uid, "checklist", id));
      } catch (err) {
        const nextList = checklist.filter((item) => item.id !== id);
        setChecklist(nextList);
        saveLocalChecklist(nextList);
      }
    },
    resetChecklist: async () => {
      try {
        if (!isFirebaseConfigured) {
          throw new Error("use-local");
        }
        if (!user) {
          throw new Error("You must be logged in to reset checklist.");
        }
        const promises = checklist.map((item) => {
          if (item.id.startsWith("local-")) return Promise.resolve();
          return updateDoc(doc(db, "users", user.uid, "checklist", item.id), { checked: 0 });
        });
        await Promise.all(promises);
        const nextList = checklist.map((item) => ({ ...item, checked: 0 }));
        setChecklist(nextList);
        saveLocalChecklist(nextList);
      } catch (err) {
        const nextList = checklist.map((item) => ({ ...item, checked: 0 }));
        setChecklist(nextList);
        saveLocalChecklist(nextList);
      }
    },
  }), [maintenance, receipts, user, vehicles, checklist]);

  return <GarageDataContext.Provider value={value}>{children}</GarageDataContext.Provider>;
}

export function useGarageData() {
  const value = useContext(GarageDataContext);

  if (!value) {
    throw new Error("useGarageData must be used within a GarageDataProvider");
  }

  return value;
}