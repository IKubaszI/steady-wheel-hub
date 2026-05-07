export type VehicleTheme = {
  key: string;
  label: string;
  // Tailwind classes for card surface gradient (overrides default)
  cardClass: string;
  // Optional accent color for tinted text/badges (foreground stays semantic)
  accentClass?: string;
};

export const VEHICLE_THEMES: VehicleTheme[] = [
  { key: "default",  label: "Default",   cardClass: "" },
  { key: "midnight", label: "Midnight",  cardClass: "bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white" },
  { key: "sunset",   label: "Sunset",    cardClass: "bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-600 text-white" },
  { key: "forest",   label: "Forest",    cardClass: "bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800 text-white" },
  { key: "ocean",    label: "Ocean",     cardClass: "bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 text-white" },
  { key: "graphite", label: "Graphite",  cardClass: "bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900 text-white" },
  { key: "racing",   label: "Racing red",cardClass: "bg-gradient-to-br from-red-600 via-rose-700 to-zinc-900 text-white" },
  { key: "sand",     label: "Sand",      cardClass: "bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200 text-zinc-900" },
];

export type VehiclePattern = {
  key: string;
  label: string;
  // Inline backgroundImage CSS for pattern overlay
  style?: React.CSSProperties;
};

export const VEHICLE_PATTERNS: VehiclePattern[] = [
  { key: "none", label: "None" },
  {
    key: "dots",
    label: "Dots",
    style: {
      backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
      backgroundSize: "14px 14px",
      opacity: 0.12,
    },
  },
  {
    key: "grid",
    label: "Grid",
    style: {
      backgroundImage:
        "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
      backgroundSize: "20px 20px",
      opacity: 0.08,
    },
  },
  {
    key: "diagonal",
    label: "Diagonal",
    style: {
      backgroundImage:
        "repeating-linear-gradient(45deg, currentColor 0 1px, transparent 1px 12px)",
      opacity: 0.1,
    },
  },
  {
    key: "carbon",
    label: "Carbon",
    style: {
      backgroundImage:
        "repeating-linear-gradient(45deg, rgba(255,255,255,.06) 0 2px, transparent 2px 6px), repeating-linear-gradient(-45deg, rgba(0,0,0,.18) 0 2px, transparent 2px 6px)",
    },
  },
  {
    key: "waves",
    label: "Waves",
    style: {
      backgroundImage:
        "radial-gradient(circle at 20% 50%, currentColor 1px, transparent 2px), radial-gradient(circle at 80% 50%, currentColor 1px, transparent 2px)",
      backgroundSize: "40px 20px",
      opacity: 0.1,
    },
  },
];

export function getTheme(key?: string) {
  return VEHICLE_THEMES.find((t) => t.key === key) ?? VEHICLE_THEMES[0];
}
export function getPattern(key?: string) {
  return VEHICLE_PATTERNS.find((p) => p.key === key) ?? VEHICLE_PATTERNS[0];
}