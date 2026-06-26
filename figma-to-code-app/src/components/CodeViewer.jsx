// ============================================================
// CodeViewer.jsx
// Wielokrotnego uzytku podglad kodu: zakladki plikow, numery linii,
// przyciski "Kopiuj" i "Pobierz". Uzywany w kazdej zakladce aplikacji.
// ============================================================
import React, { useState } from 'react';

export default function CodeViewer({ files }) {
  const [active, setActive] = useState(0);   // indeks aktywnego pliku
  const [copied, setCopied] = useState(false);

  const current = files[active] || { name: '', code: '' };
  const lines = current.code.split('\n');

  // Kopiuje kod aktywnego pliku do schowka
  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Pobiera kod aktywnego pliku jako plik na dysk
  const handleDownload = () => {
    const blob = new Blob([current.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = current.name || 'code.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="code-viewer-container">
      <div className="code-viewer-header">
        <div className="code-viewer-tabs">
          {files.map((f, i) => (
            <button
              key={f.name}
              type="button"
              className={`code-tab-btn ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
            >
              {f.name}
            </button>
          ))}
        </div>

        <div className="code-viewer-actions">
          <button type="button" className="code-action-btn" onClick={handleCopy}>
            {copied ? 'Skopiowano!' : 'Kopiuj'}
          </button>
          <button type="button" className="code-action-btn" onClick={handleDownload}>
            Pobierz
          </button>
        </div>
      </div>

      <div className="code-display">
        {lines.map((line, i) => (
          <div className="code-line" key={i}>
            <span className="code-line-no">{i + 1}</span>
            <span className="code-line-text">{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
