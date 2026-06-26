// ============================================================
// figmaColors.js
// Narzedzia do konwersji kolorow Figmy na formaty CSS
// ============================================================

/**
 * Konwertuje kolor Figma RGBA (float 0-1) do formatu #rrggbb lub #rrggbbaa
 */
export function figmaColorToHex({ r, g, b, a }) {
  const toHex = (c) => Math.round(c * 255).toString(16).padStart(2, '0');
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  return a !== undefined && a < 1 ? `${hex}${toHex(a)}` : hex;
}

/**
 * Konwertuje kolor Figma RGBA (float 0-1) do formatu rgb() / rgba()
 */
export function figmaColorToCSS({ r, g, b, a = 1 }) {
  const ri = Math.round(r * 255);
  const gi = Math.round(g * 255);
  const bi = Math.round(b * 255);
  return a < 1 ? `rgba(${ri},${gi},${bi},${a.toFixed(2)})` : `rgb(${ri},${gi},${bi})`;
}

/**
 * Zwraca kolor pierwszego wypelnienia SOLID z tablicy fills,
 * lub null jesli brak.
 */
export function getFirstSolidFill(fills) {
  if (!fills || !fills.length) return null;
  const s = fills.find((f) => f.type === 'SOLID' && f.visible !== false);
  return s ? figmaColorToCSS(s.color) : null;
}

/**
 * Rekurencyjnie przeszukuje wezel dokumentu Figmy i zbiera
 * unikalne kolory SOLID do mapy hex → nazwaWarstwy.
 */
export function extractColorsFromNodes(node, colorsMap) {
  if (node.fills) {
    node.fills.forEach((fill) => {
      if (fill.type === 'SOLID' && fill.color) {
        const hex = figmaColorToHex(fill.color);
        colorsMap.set(hex, node.name || 'Color');
      }
    });
  }
  if (node.children) {
    node.children.forEach((child) => extractColorsFromNodes(child, colorsMap));
  }
}
