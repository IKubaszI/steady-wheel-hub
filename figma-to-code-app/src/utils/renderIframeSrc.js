// ============================================================
// renderIframeSrc.js
// Buduje kompletny dokument HTML do wstawienia w <iframe srcDoc>
// ============================================================

/**
 * Tworzy string z kompletnym dokumentem HTML zawierajacym
 * wygenerowany kod HTML + CSS wewnatrz <iframe>.
 * Dodaje reset CSS zapobiegajacy poziomemu overflow.
 *
 * @param {string} html - Kod HTML z AI lub parsera Figmy
 * @param {string} css  - Kod CSS z AI lub parsera Figmy
 * @returns {string}    - Kompletny dokument HTML
 */
export function renderIframeSrc(html, css) {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Reset zapobiegajacy wychodzeniu poza iframe */
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html {
      overflow-x: hidden;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: Arial, sans-serif;
      max-width: 100%;
      overflow-x: hidden;
    }
    img, svg, video, canvas {
      max-width: 100%;
      height: auto;
    }
    .page-wrapper {
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
    }
    /* Kod wygenerowany przez AI lub parser */
    ${css}
  </style>
</head>
<body>
${html}
</body>
</html>`;
}
