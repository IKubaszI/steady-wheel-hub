// ============================================================
// TabCompiler.jsx
// Zakladka 2: AI Kompilator - zrzut ekranu → HTML + CSS
// ============================================================
import React, { useState, useRef } from 'react';
import { compileDesignImage } from '../api/geminiApi.js';
import { renderIframeSrc } from '../utils/renderIframeSrc.js';
import CodeViewer from './CodeViewer.jsx';

export default function TabCompiler({ geminiKey, setGeminiKey }) {
  const [customImage, setCustomImage] = useState(null);
  const [status, setStatus]           = useState('idle');   // idle | loading | success | error
  const [error, setError]             = useState('');
  const [result, setResult]           = useState(null);
  const fileInputRef                  = useRef(null);

  // Czyta wybrany plik graficzny i konwertuje go na Base64
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setCustomImage({ base64: reader.result, mimeType: file.type, name: file.name });
    reader.readAsDataURL(file);
  };

  // Wysyla obrazek do Gemini i zwraca { html, css, explanation }
  const handleCompile = async () => {
    if (!geminiKey) { setStatus('error'); setError('Podaj klucz API Gemini.'); return; }
    if (!customImage) { setStatus('error'); setError('Wgraj zrzut ekranu.'); return; }
    setStatus('loading');
    setError('');
    try {
      const r = await compileDesignImage(customImage.base64, customImage.mimeType, geminiKey);
      setResult(r);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Blad analizy obrazu.');
    }
  };

  return (
    <div>
      <h2>Kompilator Zrzutow Ekranow do Kodu</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
        Przeslij zrzut ekranu makiety graficznej. AI Gemini automatycznie przetlumaczy uklad na kod HTML i CSS.
      </p>

      <div className="grid-container">
        {/* Panel konfiguracji */}
        <div className="card">
          <h3 className="card-title">Konfiguracja AI</h3>

          <div className="form-group">
            <label className="form-label" htmlFor="api-key-input">Gemini API Key:</label>
            <input
              id="api-key-input"
              type="password"
              className="form-input"
              style={{ paddingLeft: '8px' }}
              placeholder="Wklej swoj klucz API"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginTop: '15px' }}>
            <label className="form-label">Zrzut ekranu makiety:</label>
            <div
              className="file-upload-zone"
              onClick={() => fileInputRef.current?.click()}
              style={{ borderStyle: customImage ? 'solid' : 'dashed' }}
            >
              <span className="upload-text">{customImage ? customImage.name : 'Wgraj wlasna grafike'}</span>
              <span className="upload-hint">Wybierz plik PNG/JPG</span>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden-file-input"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn btn-accent"
            onClick={handleCompile}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Kompilowanie...' : 'Kompiluj do kodu'}
          </button>
        </div>

        {/* Panel wynikow */}
        <div>
          {status === 'idle' && (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <p style={{ color: 'var(--text-muted)' }}>Kliknij "Kompiluj do kodu", aby rozpoczac proces.</p>
            </div>
          )}

          {status === 'loading' && (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: '10px' }}>Wysylanie obrazu i pobieranie kodu z Gemini...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="alert alert-error">
              <strong>Wystapil blad:</strong> {error}
            </div>
          )}

          {status === 'success' && result && (
            <div>
              {/* Porownanie wizualne: oryginał vs render */}
              <div className="card">
                <h3 className="card-title">Porownanie wizualne</h3>
                <div className="split-preview">
                  {/* Oryginalna makieta */}
                  <div className="preview-box">
                    <div className="preview-box-header">Makieta wejsciowa</div>
                    <div className="preview-box-content">
                      {customImage ? (
                        <img src={customImage.base64} alt="mockup" className="preview-image" />
                      ) : (
                        <span>Brak obrazu</span>
                      )}
                    </div>
                  </div>

                  {/* Wyrenderowany kod HTML/CSS w iframe */}
                  <div className="preview-box">
                    <div className="preview-box-header">Wyrenderowany kod HTML/CSS</div>
                    <div className="preview-box-content">
                      <iframe
                        title="Render Box"
                        srcDoc={renderIframeSrc(result.html, result.css)}
                        sandbox="allow-scripts"
                        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Kod zrodlowy */}
              <div className="card">
                <h3 style={{ marginBottom: '10px' }}>Kod zrodlowy</h3>

                <p style={{ fontSize: '0.85rem', color: '#555', backgroundColor: '#eef2f7', padding: '10px', borderRadius: '4px', borderLeft: '4px solid var(--accent-color)', margin: '0 0 15px 0' }}>
                  <strong>Opis:</strong> {result.explanation}
                </p>

                <CodeViewer
                  files={[
                    { name: 'component.html', code: result.html },
                    { name: 'component.css', code: result.css },
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
