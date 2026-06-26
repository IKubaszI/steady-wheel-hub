// ============================================================
// figmaParser.js
// Parser wezlow Figmy do kodu HTML + CSS (Zakladka 3)
// ============================================================

import { figmaColorToCSS, getFirstSolidFill } from './figmaColors.js';

// Mapuje wyrownanie auto-layoutu Figmy na wartosci flexboxa
function alignToFlex(value) {
  switch (value) {
    case 'MIN':           return 'flex-start';
    case 'CENTER':        return 'center';
    case 'MAX':           return 'flex-end';
    case 'SPACE_BETWEEN': return 'space-between';
    default:              return null;
  }
}

// Zwraca reguly flexboxa dla wezla z wlaczonym auto-layoutem
function autoLayoutRules(node) {
  const rules = [
    'display:flex',
    node.layoutMode === 'VERTICAL' ? 'flex-direction:column' : 'flex-direction:row',
  ];
  if (node.itemSpacing)   rules.push(`gap:${node.itemSpacing}px`);
  if (node.paddingLeft)   rules.push(`padding-left:${node.paddingLeft}px`);
  if (node.paddingRight)  rules.push(`padding-right:${node.paddingRight}px`);
  if (node.paddingTop)    rules.push(`padding-top:${node.paddingTop}px`);
  if (node.paddingBottom) rules.push(`padding-bottom:${node.paddingBottom}px`);

  const justify = alignToFlex(node.primaryAxisAlignItems);
  const align   = alignToFlex(node.counterAxisAlignItems);
  if (justify) rules.push(`justify-content:${justify}`);
  if (align)   rules.push(`align-items:${align}`);
  return rules;
}

/**
 * Rekurencyjnie konwertuje wezel Figmy na HTML + reguly CSS.
 * O sposobie pozycjonowania dziecka decyduje RODZIC:
 *  - rodzic z auto-layoutem  -> dziecko plynie we flexie (position:relative)
 *  - rodzic bez auto-layoutu -> dziecko ustawiane absolutnie (left/top)
 *
 * @param {object} node     - Wezel z dokumentu Figmy
 * @param {object} parent   - Wezel-rodzic (do odczytu layoutMode i pozycji)
 * @param {string[]} cssArr - Tablica zbierajaca reguly CSS
 * @param {{v:number}} counter - Licznik unikalnych nazw klas
 * @returns {string} Fragment HTML
 */
export function figmaNodeToCode(node, parent, cssArr, counter) {
  if (node.visible === false) return '';
  const bb = node.absoluteBoundingBox;
  if (!bb) return '';

  const cls = `n${counter.v++}`;
  const parentBB = parent.absoluteBoundingBox;
  const parentIsAuto = parent.layoutMode && parent.layoutMode !== 'NONE';

  const posRules = parentIsAuto
    ? ['position:relative']
    : [
        'position:absolute',
        `left:${Math.round(bb.x - parentBB.x)}px`,
        `top:${Math.round(bb.y - parentBB.y)}px`,
      ];

  // --- Wezel tekstowy ---
  if (node.type === 'TEXT') {
    const s = node.style || {};
    const color = getFirstSolidFill(node.fills);

    const rules = [
      ...posRules,
      `width:${Math.round(bb.width)}px`,
      s.fontSize            ? `font-size:${s.fontSize}px`                          : null,
      s.fontFamily          ? `font-family:'${s.fontFamily}',sans-serif`           : null,
      s.fontWeight          ? `font-weight:${s.fontWeight}`                        : null,
      s.textAlignHorizontal ? `text-align:${s.textAlignHorizontal.toLowerCase()}`  : null,
      s.lineHeightPx && s.lineHeightPx > 0 ? `line-height:${s.lineHeightPx}px`     : null,
      s.letterSpacing       ? `letter-spacing:${s.letterSpacing}px`                : null,
      color                 ? `color:${color}`                                     : null,
      `white-space:pre-wrap`,
      `word-break:break-word`,
      `margin:0`,
    ].filter(Boolean).join(';');

    cssArr.push(`.${cls}{${rules}}`);

    const text = (node.characters || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    return `<p class="${cls}">${text}</p>`;
  }

  // --- Wezel kontenerowy (FRAME, GROUP, RECTANGLE, ELLIPSE, itp.) ---
  const isAuto = node.layoutMode && node.layoutMode !== 'NONE';
  const bg = getFirstSolidFill(node.fills);

  const styleArr = [
    ...posRules,
    `width:${Math.round(bb.width)}px`,
    `height:${Math.round(bb.height)}px`,
    bg                                             ? `background-color:${bg}`             : null,
    node.cornerRadius                              ? `border-radius:${node.cornerRadius}px` : null,
    node.type === 'ELLIPSE'                        ? `border-radius:50%`                  : null,
    node.opacity !== undefined && node.opacity < 1 ? `opacity:${node.opacity.toFixed(2)}` : null,
    `overflow:hidden`,
  ].filter(Boolean);

  if (isAuto) styleArr.push(...autoLayoutRules(node));

  // Obramowanie (stroke)
  if (node.strokes && node.strokes.length && node.strokeWeight) {
    const stroke = node.strokes.find((s) => s.type === 'SOLID' && s.visible !== false);
    if (stroke) {
      styleArr.push(`border:${node.strokeWeight}px solid ${figmaColorToCSS(stroke.color)}`);
    }
  }

  cssArr.push(`.${cls}{${styleArr.join(';')}}`);

  const inner = (node.children || [])
    .filter((c) => c.visible !== false)
    .map((child) => figmaNodeToCode(child, node, cssArr, counter))
    .join('');

  return `<div class="${cls}">${inner}</div>`;
}

/**
 * Konwertuje cala ramke Figmy na obiekt { html, css, width, height, frameName }.
 * @param {object} frame - Wezel typu FRAME z dokumentu Figmy
 */
export function convertFrameToCode(frame) {
  const bb = frame.absoluteBoundingBox;
  if (!bb) throw new Error('Ramka nie ma wymiarow (brak absoluteBoundingBox).');

  const cssArr = [];
  const counter = { v: 0 };
  const bg = getFirstSolidFill(frame.fills);
  const isAuto = frame.layoutMode && frame.layoutMode !== 'NONE';

  // Ramka glowna jest zawsze position:relative, zeby absolutne dzieci
  // pozycjonowaly sie wzgledem niej.
  const frameRules = [
    'position:relative',
    `width:${Math.round(bb.width)}px`,
    `height:${Math.round(bb.height)}px`,
    bg ? `background-color:${bg}` : null,
    'overflow:hidden',
  ].filter(Boolean);

  if (isAuto) frameRules.push(...autoLayoutRules(frame));

  cssArr.push(`.figma-frame{${frameRules.join(';')}}`);

  const inner = (frame.children || [])
    .filter((c) => c.visible !== false)
    .map((child) => figmaNodeToCode(child, frame, cssArr, counter))
    .join('');

  return {
    html: `<div class="figma-frame">\n${inner}\n</div>`,
    css: cssArr.join('\n'),
    width: Math.round(bb.width),
    height: Math.round(bb.height),
    frameName: frame.name,
  };
}
