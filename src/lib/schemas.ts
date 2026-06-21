import { z } from "zod";

export const MAX_USER_NAME_LENGTH = 80;
export const userDisplayNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required.")
  .max(MAX_USER_NAME_LENGTH, `Name must be at most ${MAX_USER_NAME_LENGTH} characters.`);

export const vehicleInputSchema = z.object({
  brand: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(120),
  year: z.number().int().gte(1900).lte(2100),
  mileage: z.number().int().gte(0).lte(2_000_000),
  plate: z.string().trim().min(1).max(24),
  color: z.string().trim().min(1).max(40),
  nextService: z.string().date(),
  fuelLitersTotal: z.number().gte(0).optional(),
  image: z.string().optional(),
  logoUrl: z.string().optional(),
  theme: z.string().optional(),
  pattern: z.string().optional(),
});

export const maintenanceInputSchema = z.object({
  vehicleId: z.string().trim().min(1),
  type: z.string().trim().min(1).max(120),
  date: z.string().date(),
  cost: z.number().gte(0).lte(1_000_000),
  status: z.enum(["completed", "upcoming", "overdue"]),
  notes: z.string().max(2000),
});

export const receiptInputSchema = z.object({
  vehicleId: z.string().trim().min(1),
  vendor: z.string().trim().min(1).max(160),
  category: z.enum(["fuel", "parts", "service", "insurance", "other"]),
  amount: z.number().gt(0).lte(1_000_000),
  date: z.string().date(),
  fuelLiters: z.number().gt(0).max(500).optional(),
  photos: z.array(z.string()).max(12),
  description: z.string().max(2000).optional(),
});

export const MAX_RECEIPT_FILES = 12;
export const MAX_RECEIPT_FILE_SIZE_BYTES = 15 * 1024 * 1024;
