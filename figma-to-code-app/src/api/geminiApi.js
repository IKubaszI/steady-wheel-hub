// ============================================================
// geminiApi.js
// Komunikacja z Google Gemini API (analiza obrazow, generowanie kodu)
// ============================================================

// Lista modeli Gemini probowana po kolei, gdy poprzedni ma wyczerpany limit
const GEMINI_MODELS = [
  'gemini-2.0-flash',       // limit: 200 req/dzien (Free Tier)
  'gemini-2.0-flash-lite',  // limit: 1500 req/dzien (Free Tier)
  'gemini-2.5-flash',       // limit: 20 req/dzien  (Free Tier)
];

// ----------------------------------------------------------------
// Wyslanie jednego zapytania do wybranego modelu Gemini
// Zwraca surowy obiekt Response (bez parsowania)
// ----------------------------------------------------------------
async function callGeminiModel(modelName, prompt, base64Data, mimeType, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: mimeType || 'image/png', data: base64Data } },
        ],
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        // Wymusza zwrot scisloego JSON wg schematu
        responseSchema: {
          type: 'OBJECT',
          properties: {
            explanation: { type: 'STRING' },
            html:        { type: 'STRING' },
            css:         { type: 'STRING' },
          },
          required: ['explanation', 'html', 'css'],
        },
      },
    }),
  });
}

// ----------------------------------------------------------------
// Czyszczenie kodu zwroconego przez AI
// Czasem model dokleja bloki markdown (```html), pelny dokument
// (<html>, <head>, <body>) albo style w <style> - tu to usuwamy,
// zeby do podgladu trafil czysty fragment HTML i czysty CSS.
// ----------------------------------------------------------------
function stripFences(code) {
  return (code || '')
    .trim()
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function normalizeHtml(html) {
  let out = stripFences(html);
  // Jesli AI zwrocilo pelny dokument, bierzemy tylko zawartosc <body>
  const body = out.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (body) out = body[1];
  // Usuwamy tagi dokumentu i bloki <style> (style przenosimy do CSS osobno)
  return out
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<\/?html[^>]*>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<\/?body[^>]*>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .trim();
}

function normalizeCss(css) {
  return stripFences(css)
    .replace(/<\/?style[^>]*>/gi, '')
    .trim();
}

// Parsuje JSON nawet gdy model owinie go w blok markdown ```json
function safeJsonParse(text) {
  return JSON.parse(stripFences(text));
}

// ----------------------------------------------------------------
// Glowna funkcja: analizuje obraz makiety i zwraca { html, css, explanation }
// Automatycznie probuje kolejne modele jesli poprzedni ma limit 429
// ----------------------------------------------------------------
export async function compileDesignImage(base64Data, mimeType, apiKey) {
  // Usun prefix "data:image/png;base64," - API Gemini chce czysty string
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

  const prompt = `Jestes ekspertem UI/UX i front-end developerem.
Twoim zadaniem jest jak najdokladniejsze odwzorowanie makiety z przeslane obrazka w kod HTML5 i Vanilla CSS.

ZASADY:
1. Odwzoruj DOKLADNIE kazdy element wizualny - tekst, kolory, odstepy, ramki, ksztalty, typografie.
2. Uzywaj WYLACZNIE czystego HTML5 i Vanilla CSS - bez bibliotek, bez Tailwind, bez Bootstrap.
3. Uzywaj normalnego przeplywu dokumentu z flexbox/grid. NIE uzywaj position:absolute ani
   stalych wysokosci na calych sekcjach - dzieki temu uklad jest responsywny i nie rozjezdza sie.
4. Kolory kopiuj dokladnie z makiety uzywajac hex lub rgb(). Rozmiary podawaj w px lub rem.
5. Dla tekstu zachowaj dokladne font-size, font-weight, kolor i line-height.
6. Dodaj style resetujace na poczatku CSS: * { box-sizing: border-box; margin: 0; padding: 0; }
7. Cala strona powinna byc zamknieta w jednym kontenerze .page-wrapper o szerokosci width:100%.
8. HTML musi byc kompletny (wszystkie otwarte tagi musza byc zamkniete).
9. W polu "html" wstaw TYLKO sam fragment HTML (zaczynajacy sie od <div class="page-wrapper">).
   NIE dodawaj <!DOCTYPE>, <html>, <head>, <body> ani znacznika <style>.
10. W polu "css" wstaw TYLKO czysty CSS, bez znacznika <style>.

Zwroc TYLKO I WYLACZNIE obiekt JSON (bez blokow markdown):
{
  "explanation": "Krotki opis komponentu po polsku",
  "html": "fragment HTML zaczynajacy sie od <div class=\\"page-wrapper\\">",
  "css": "kompletny kod CSS ze wszystkimi stylami"
}`;

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    let response;
    try {
      response = await callGeminiModel(model, prompt, cleanBase64, mimeType, apiKey);
    } catch (networkErr) {
      lastError = new Error(`Blad sieci: ${networkErr.message}`);
      continue;
    }

    if (response.status === 429) {
      // Wyczerpany limit → probuj nastepny model
      let retrySeconds = null;
      try {
        const errData = await response.clone().json();
        const retryInfo = errData?.error?.details?.find((d) => d['@type']?.includes('RetryInfo'));
        if (retryInfo?.retryDelay) retrySeconds = parseInt(retryInfo.retryDelay);
      } catch {}
      lastError = { isQuota: true, model, retrySeconds };
      continue;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Blad Gemini (${model}): ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) throw new Error('Brak odpowiedzi od Gemini.');

    let parsed;
    try {
      parsed = safeJsonParse(textResponse);
    } catch {
      throw new Error('Gemini zwrocil odpowiedz w nieprawidlowym formacie. Sprobuj ponownie.');
    }

    // Gdyby AI wstawilo style w <style> wewnatrz HTML - przenosimy je do CSS
    const inlineStyles = [...(parsed.html || '').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
      .map((m) => m[1])
      .join('\n');

    return {
      explanation: parsed.explanation || '',
      html: normalizeHtml(parsed.html),
      css: normalizeCss((parsed.css || '') + '\n' + inlineStyles),
    };
  }

  // Wszystkie modele wyczerpane
  if (lastError?.isQuota) {
    const retry = lastError.retrySeconds ? ` Odczekaj ${lastError.retrySeconds}s i sprobuj ponownie.` : '';
    throw new Error(
      `Wyczerpany dzienny limit API Gemini (darmowy plan - 20 req/dzien).${retry} Mozesz rowniez zmienic klucz API na nowy.`
    );
  }
  throw lastError || new Error('Nie udalo sie polaczyc z Gemini.');
}
