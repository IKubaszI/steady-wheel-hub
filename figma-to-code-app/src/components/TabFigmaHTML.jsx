// ============================================================
// TabFigmaHTML.jsx
// Zakladka 3: Figma → HTML/CSS (parser wezlow)
// ============================================================
import React, { useState } from 'react';
import { fetchFigmaDocument } from '../api/figmaApi.js';
import { convertFrameToCode } from '../utils/figmaParser.js';
import { renderIframeSrc } from '../utils/renderIframeSrc.js';
import CodeViewer from './CodeViewer.jsx';

export default function TabFigmaHTML({ figmaFileKey, setFigmaFileKey, figmaToken, setFigmaToken }) {
  const [docData, setDocData]                 = useState(null);
  const [frames, setFrames]                   = useState([]);
  const [selectedFrameId, setSelectedFrameId] = useState('');
  const [status, setStatus]                   = useState('idle');   // idle | fetching | selecting | generating | success | error
  const [error, setError]                     = useState('');
  const [result, setResult]                   = useState(null);

  // Krok 1: pobiera dokument Figmy i wyciaga liste ramek
  const handleFetchFrames = async () => {
    if (!figmaFileKey || !figmaToken) {
      setStatus('error');
      setError('Uzupelnij Figma File Key i Access Token w zakladce 1.');
      return;
    }
    setStatus('fetching');
    setError('');
    try {
      const data = await fetchFigmaDocument(figmaFileKey, figmaToken);
      setDocData(data);

      // Zbieramy ekrany (FRAME) bedace dziecmi stron i sekcji.
      // Wchodzimy tylko przez kontenery porzadkujace (CANVAS/SECTION/GROUP),
      // nie schodzimy w glab samego ekranu.
      const found = [];
      const walk = (node) => {
        if (!node.children) return;
        node.children.forEach((child) => {
          if (child.type === 'FRAME' && child.absoluteBoundingBox) {
            found.push({
              id: child.id,
              name: child.name,
              w: Math.round(child.absoluteBoundingBox.width),
              h: Math.round(child.absoluteBoundingBox.height),
            });
          } else if (['CANVAS', 'SECTION', 'GROUP'].includes(child.type)) {
            walk(child);
          }
        });
      };
      walk(data.document);

      setFrames(found);
      if (found.length > 0) setSelectedFrameId(found[0].id);
      setStatus('selecting');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Blad pobierania dokumentu.');
    }
  };

  // Krok 2: parsuje wybrana ramke i generuje HTML + CSS
  const handleGenerate = () => {
    if (!docData || !selectedFrameId) return;
    setStatus('generating');
    setError('');
    try {
      let frame = null;
      const find = (node) => {
        if (node.id === selectedFrameId) { frame = node; return; }
        if (node.children) node.children.forEach(find);
      };
      find(docData.document);

      if (!frame) throw new Error('Nie znaleziono wybranej ramki w dokumencie.');
      setResult(convertFrameToCode(frame));
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Blad generowania kodu.');
    }
  };

  return (
    <div>
      <h2>Figma do HTML/CSS</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
        Parsowanie struktury ramki Figmy bezposrednio do kodu HTML i CSS przez REST API.
        Uzywa tego samego klucza i tokenu co zakladka 1.
      </p>

      <div className="grid-container">
        {/* Panel sterowania */}
        <div className="card">
          <h3 className="card-title">Ustawienia</h3>

          <div className="form-group">
            <label className="form-label" htmlFor="figma-html-file-key">Figma File Key:</label>
            <input
              id="figma-html-file-key"
              type="text"
              className="form-input"
              style={{ paddingLeft: '8px' }}
              placeholder="Wpisz klucz pliku"
              value={figmaFileKey}
              onChange={(e) => setFigmaFileKey(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="figma-html-token">Access Token:</label>
            <input
              id="figma-html-token"
              type="password"
              className="form-input"
              style={{ paddingLeft: '8px' }}
              placeholder="figd_..."
              value={figmaToken}
              onChange={(e) => setFigmaToken(e.target.value)}
            />
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
            Te dane sa wspoldzielone z zakladka 1 - zmiana tutaj dziala w obu miejscach.
          </p>

          <button
            type="button"
            className="btn"
            onClick={handleFetchFrames}
            disabled={status === 'fetching' || !figmaFileKey || !figmaToken}
          >
            {status === 'fetching' ? 'Pobieranie...' : 'Pobierz ramki z Figmy'}
          </button>

          {/* Dropdown wyboru ramki */}
          {['selecting', 'generating', 'success'].includes(status) && frames.length > 0 && (
            <div className="form-group" style={{ marginTop: '15px' }}>
              <label className="form-label">Wybierz ramke do konwersji:</label>
              <select
                className="form-input"
                style={{ paddingLeft: '8px' }}
                value={selectedFrameId}
                onChange={(e) => setSelectedFrameId(e.target.value)}
              >
                {frames.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.w}x{f.h}px)</option>
                ))}
              </select>
            </div>
          )}

          {['selecting', 'success'].includes(status) && (
            <button
              type="button"
              className="btn btn-accent"
              style={{ marginTop: '10px' }}
              onClick={handleGenerate}
              disabled={!selectedFrameId}
            >
              Generuj HTML + CSS
            </button>
          )}

          {status === 'error' && (
            <div className="alert alert-error" style={{ marginTop: '15px' }}>
              <strong>Blad:</strong> {error}
            </div>
          )}
        </div>

        {/* Panel wynikow */}
        <div>
          {status === 'idle' && (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <p style={{ color: 'var(--text-muted)' }}>Kliknij "Pobierz ramki z Figmy" aby rozpoczac.</p>
            </div>
          )}

          {status === 'fetching' && (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: '10px' }}>Pobieranie dokumentu z Figmy...</p>
            </div>
          )}

          {status === 'generating' && (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: '10px' }}>Parsowanie wezlow i generowanie kodu...</p>
            </div>
          )}

          {status === 'selecting' && frames.length > 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                Znaleziono {frames.length} ramek. Wybierz ramke i kliknij "Generuj HTML + CSS".
              </p>
            </div>
          )}

          {status === 'success' && result && (
            <div>
              {/* Podglad w iframe z automatycznym skalowaniem */}
              <div className="card">
                <h3 className="card-title">
                  Podglad: {result.frameName}
                  <span className="badge-live">{result.width}x{result.height}px</span>
                </h3>
                {(() => {
                  // Skalujemy podglad tak, by szeroka ramka zmiescila sie w panelu.
                  const scale = Math.min(1, 820 / result.width);
                  return (
                    <div style={{ width: '100%', height: '450px', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'auto', background: '#e9ecef' }}>
                      {/* Wrapper ma rozmiar PO przeskalowaniu, dzieki czemu paski
                          przewijania odpowiadaja temu, co faktycznie widac. */}
                      <div style={{ width: `${Math.round(result.width * scale)}px`, height: `${Math.round(result.height * scale)}px` }}>
                        <iframe
                          title="Figma HTML Preview"
                          srcDoc={renderIframeSrc(result.html, result.css)}
                          sandbox="allow-scripts"
                          style={{
                            width: `${result.width}px`,
                            height: `${result.height}px`,
                            border: 'none',
                            display: 'block',
                            transformOrigin: '0 0',
                            transform: `scale(${scale})`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Kod zrodlowy */}
              <div className="card">
                <h3 style={{ margin: '0 0 10px 0' }}>Kod zrodlowy</h3>
                <CodeViewer
                  files={[
                    { name: 'frame.html', code: result.html },
                    { name: 'frame.css', code: result.css },
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
