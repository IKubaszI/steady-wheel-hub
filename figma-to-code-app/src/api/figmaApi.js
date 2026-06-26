// ============================================================
// figmaApi.js
// Komunikacja z REST API Figmy: pobieranie tokenow i dokumentu
// ============================================================

import { figmaColorToHex, extractColorsFromNodes } from '../utils/figmaColors.js';

// Cache sesji - wyniki API zapamietane do konca sesji przegladarki
export const figmaCache = new Map();

// Czeka n milisekund (uzywane przy retry po 429)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ----------------------------------------------------------------
// Pobieranie tokenow designu przez Variables API (konta platne)
// lub przez Files API jako fallback (konta darmowe)
// ----------------------------------------------------------------
export async function fetchFigmaVariables(fileKey, token) {
  const cacheKey = `${fileKey}:${token}`;
  if (figmaCache.has(cacheKey)) {
    console.log('[figmaApi] Uzywam danych z cache sesji.');
    return figmaCache.get(cacheKey);
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    let response;
    try {
      response = await fetch(
        `https://api.figma.com/v1/files/${fileKey}/variables/local`,
        { headers: { 'X-Figma-Token': token, Accept: 'application/json' } }
      );
    } catch (networkErr) {
      throw new Error(`Blad sieci: ${networkErr.message}`);
    }

    // 403 = darmowe konto osobiste → fallback na Files API
    if (response.status === 403) {
      console.log('[figmaApi] Variables API niedostepne (403). Uruchamianie fallbacku...');
      const result = await fetchFigmaStylesFallback(fileKey, token);
      figmaCache.set(cacheKey, result);
      return result;
    }

    // 429 = rate limit → odczekaj i probuj ponownie
    if (response.status === 429) {
      if (attempt < 3) {
        console.log(`[figmaApi] Rate limit (proba ${attempt}/3). Czekam 5s...`);
        await sleep(5000);
        continue;
      }
      throw new Error('Figma API: zbyt wiele zapytan (429). Odczekaj chwile i sprobuj ponownie.');
    }

    if (!response.ok) {
      throw new Error(`Figma API zwrocilo status: ${response.status}`);
    }

    const data = await response.json();

    // Brak zmiennych Variables → fallback
    if (!data.meta || !data.meta.variables) {
      const result = await fetchFigmaStylesFallback(fileKey, token);
      figmaCache.set(cacheKey, result);
      return result;
    }

    // Mapa kolekcji ID → nazwa
    const collectionsMap = {};
    if (data.meta.variableCollections) {
      Object.values(data.meta.variableCollections).forEach((c) => {
        collectionsMap[c.id] = c.name;
      });
    }

    const tokens = Object.values(data.meta.variables).map((v) => {
      const colName = collectionsMap[v.variableCollectionId] || 'global';
      let val = '';
      const modes = Object.keys(v.valuesByMode);
      if (modes.length > 0) {
        const rawVal = v.valuesByMode[modes[0]];
        val =
          typeof rawVal === 'object' && rawVal !== null && 'r' in rawVal
            ? figmaColorToHex(rawVal)
            : String(rawVal);
      }
      const cssName = `--${colName.toLowerCase()}-${v.name.toLowerCase().replace(/[\s/]+/g, '-')}`;
      return { id: v.id, name: v.name, collection: colName, type: v.resolvedType, value: val, cssName };
    });

    figmaCache.set(cacheKey, tokens);
    return tokens;
  }
}

// ----------------------------------------------------------------
// Fallback: pobiera caly plik Figmy i wyciaga kolory z warstw
// ----------------------------------------------------------------
export async function fetchFigmaStylesFallback(fileKey, token) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    let response;
    try {
      response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
        headers: { 'X-Figma-Token': token, Accept: 'application/json' },
      });
    } catch (networkErr) {
      throw new Error(`Blad sieci: ${networkErr.message}`);
    }

    if (response.status === 429) {
      if (attempt < 3) {
        console.log(`[figmaApi] Rate limit w fallback (proba ${attempt}/3). Czekam 5s...`);
        await sleep(5000);
        continue;
      }
      throw new Error('Figma API: zbyt wiele zapytan (429). Odczekaj chwile i kliknij Pobierz dane ponownie.');
    }

    if (!response.ok) {
      if (response.status === 403) throw new Error('Bledny token dostepu Figmy (403). Sprawdz uprawnienia tokenu.');
      if (response.status === 404) throw new Error('Nie znaleziono pliku Figmy (404). Sprawdz File Key.');
      throw new Error(`API Figmy zwrocilo status: ${response.status}`);
    }

    const data = await response.json();
    const colorsMap = new Map();
    if (data.document) extractColorsFromNodes(data.document, colorsMap);

    if (colorsMap.size === 0) {
      throw new Error('Polaczono z plikiem, ale nie znaleziono zadnych kolorow solidnych w warstwach.');
    }

    const tokens = [];
    let count = 1;
    colorsMap.forEach((nodeName, hex) => {
      if (count <= 20) {
        const cleanName = nodeName.replace(/[^a-zA-Z0-9]/g, ' ').trim().replace(/\s+/g, '-').toLowerCase();
        tokens.push({
          id: `style-color-${count}`,
          name: `Kolor z warstwy: ${nodeName}`,
          collection: `Importowane z ${data.name || 'pliku'}`,
          type: 'COLOR',
          value: hex,
          cssName: `--figma-color-${cleanName || 'solid'}-${count}`,
        });
        count++;
      }
    });
    return tokens;
  }
}

// ----------------------------------------------------------------
// Pobieranie pelnego dokumentu Figmy (do parsowania ramek - Tab 3)
// Uzywa osobnego klucza cache z prefiksem "doc:"
// ----------------------------------------------------------------
export async function fetchFigmaDocument(fileKey, token) {
  const cacheKey = `doc:${fileKey}:${token}`;
  if (figmaCache.has(cacheKey)) {
    console.log('[figmaApi] Uzywam dokumentu z cache sesji.');
    return figmaCache.get(cacheKey);
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    let response;
    try {
      response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
        headers: { 'X-Figma-Token': token, Accept: 'application/json' },
      });
    } catch (networkErr) {
      throw new Error(`Blad sieci: ${networkErr.message}`);
    }

    if (response.status === 429 && attempt < 3) {
      await sleep(5000);
      continue;
    }
    if (!response.ok) throw new Error(`Figma API: ${response.status}`);

    const data = await response.json();
    figmaCache.set(cacheKey, data);
    return data;
  }

  throw new Error('Figma API: zbyt wiele zapytan (429). Odczekaj chwile i sprobuj ponownie.');
}
