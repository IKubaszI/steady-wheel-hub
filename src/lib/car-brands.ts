// Brand logo URLs sourced from the carlogos.org public CDN.
// Falls back gracefully via UI when load fails.
const BASE = "https://www.carlogos.org/car-logos";

export type CarBrand = { name: string; slug: string; logo: string };

function brand(name: string, slug: string): CarBrand {
  return { name, slug, logo: `${BASE}/${slug}-logo.png` };
}

export const CAR_BRANDS: CarBrand[] = [
  brand("Tesla", "tesla"),
  brand("Toyota", "toyota"),
  brand("BMW", "bmw"),
  brand("Ford", "ford"),
  brand("Audi", "audi"),
  brand("Mercedes-Benz", "mercedes-benz"),
  brand("Volkswagen", "volkswagen"),
  brand("Honda", "honda"),
  brand("Nissan", "nissan"),
  brand("Hyundai", "hyundai"),
  brand("Kia", "kia"),
  brand("Mazda", "mazda"),
  brand("Subaru", "subaru"),
  brand("Volvo", "volvo"),
  brand("Porsche", "porsche"),
  brand("Jaguar", "jaguar"),
  brand("Land Rover", "land-rover"),
  brand("Lexus", "lexus"),
  brand("Mini", "mini"),
  brand("Fiat", "fiat"),
  brand("Peugeot", "peugeot"),
  brand("Renault", "renault"),
  brand("Skoda", "skoda"),
  brand("Opel", "opel"),
  brand("Chevrolet", "chevrolet"),
  brand("Dodge", "dodge"),
  brand("Jeep", "jeep"),
  brand("GMC", "gmc"),
  brand("Cadillac", "cadillac"),
];

export function findBrandLogo(brandName?: string | null): string | null {
  if (!brandName) return null;
  const n = brandName.trim().toLowerCase();
  const match = CAR_BRANDS.find((b) => b.name.toLowerCase() === n || b.slug === n);
  return match?.logo ?? null;
}