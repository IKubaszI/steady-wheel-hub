// ============================================================
// TabTokens.jsx
// Zakladka 1: Tokeny z Figmy → Zmienne CSS
// ============================================================
import React, { useState } from 'react';
import { fetchFigmaVariables } from '../api/figmaApi.js';
import CodeViewer from './CodeViewer.jsx';

// Generuje blok :root { --zmienna: wartosc; } z tablicy tokenow
function generateCSSVariables(tokens) {
  let css = `/* Zmienne wygenerowane z Figmy */\n:root {\n`;
  tokens.forEach((t) => {
    css += `  ${t.cssName}: ${t.value};\n`;
  });
  css += `}`;
  return css;
}

function copyText(text, callback) {
  navigator.clipboard.writeText(text);
  callback(true);
  setTimeout(() => callback(false), 2000);
}

export default function TabTokens({ figmaFileKey, setFigmaFileKey, figmaToken, setFigmaToken }) {
  const [status, setStatus]           = useState('idle');   // idle | loading | success | error
  const [error, setError]             = useState('');
  const [tokens, setTokens]           = useState([]);
  const [copiedTokenId, setCopiedTokenId] = useState(null);

  const handleSync = async (e) => {
    e.preventDefault();
    if (!figmaFileKey || !figmaToken) {
      setStatus('error');
      setError('Wpisz klucz pliku oraz token dostepu.');
      return;
    }
    setStatus('loading');
    setError('');
    try {
      const parsed = await fetchFigmaVariables(figmaFileKey, figmaToken);
      setTokens(parsed);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Wystapil blad pobierania danych.');
    }
  };

  return (
    <div>
      <h2>Zmienne z Figmy do CSS</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
        Pobieranie tokenow i kolorow bezposrednio z warstw makiety przez REST API Figmy i konwersja do kodu CSS.
      </p>

      <div className="grid-container">
        {/* Formularz polaczenia */}
        <div className="card">
          <h3 className="card-title">Polaczenie z Figma</h3>
          <form onSubmit={handleSync}>
            <div className="form-group">
              <label className="form-label" htmlFor="file-key-input">Figma File Key:</label>
              <input
                id="file-key-input"
                type="text"
                className="form-input"
                style={{ paddingLeft: '8px' }}
                placeholder="Wpisz klucz pliku"
                value={figmaFileKey}
                onChange={(e) => setFigmaFileKey(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pat-input">Access Token:</label>
              <input
                id="pat-input"
                type="password"
                className="form-input"
                style={{ paddingLeft: '8px' }}
                placeholder="figd_..."
                value={figmaToken}
                onChange={(e) => setFigmaToken(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn" disabled={status === 'loading'}>
              {status === 'loading' ? 'Pobieranie...' : 'Pobierz dane'}
            </button>
          </form>
        </div>

        {/* Wyniki */}
        <div>
          {status === 'idle' && (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text-muted)' }}>Kliknij przycisk "Pobierz dane", aby zaladowac zmienne na zywo.</p>
            </div>
          )}

          {status === 'loading' && (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: '10px' }}>Pobieranie danych z Figmy...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="alert alert-error">
              <strong>Blad:</strong> {error}
            </div>
          )}

          {status === 'success' && (
            <div>
              {/* Siatka tokenow kolorow */}
              <div className="card">
                <h3 className="card-title">Importowane Zmienne</h3>
                <div className="token-grid">
                  {tokens.map((t) => (
                    <div className="token-card" key={t.id}>
                      <div className="color-preview" style={{ backgroundColor: t.value }}>
                        <span className="color-preview-value">{t.value}</span>
                      </div>
                      <div className="token-info">
                        <span className="token-name">{t.name}</span>
                        <div className="token-code">
                          <span>{t.cssName}</span>
                          <button
                            type="button"
                            className="copy-btn"
                            onClick={() => copyText(t.cssName, (val) => setCopiedTokenId(val ? t.id : null))}
                          >
                            {copiedTokenId === t.id ? 'OK' : 'Kopiuj'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wygenerowany CSS */}
              <div className="card">
                <h3 style={{ margin: '0 0 10px 0' }}>Zmienne CSS</h3>
                <CodeViewer files={[{ name: 'tokens.css', code: generateCSSVariables(tokens) }]} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
