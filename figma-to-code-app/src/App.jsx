// ============================================================
// App.jsx
// Glowny komponent aplikacji - zarzadza zakladkami i wspolnym
// stanem (figmaFileKey, figmaToken, geminiKey) przekazywanym
// do komponentow zakladek przez props.
// ============================================================
import React, { useState } from 'react';
import './App.css';

import TabTokens    from './components/TabTokens.jsx';
import TabCompiler  from './components/TabCompiler.jsx';
import TabFigmaHTML from './components/TabFigmaHTML.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('tokens'); // tokens | vision | figma-html

  // Stan wspolny dla zakladek 1 i 3 (oba uzywaja tych samych kluczy Figmy)
  const [figmaFileKey, setFigmaFileKey] = useState(import.meta.env.VITE_FIGMA_FILE_KEY || '');
  const [figmaToken, setFigmaToken]     = useState(import.meta.env.VITE_FIGMA_PAT || '');

  // Stan wspolny dla zakladki 2 (klucz Gemini)
  const [geminiKey, setGeminiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');

  return (
    <div className="app-container" id="root-playground">
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo">F2C</div>
          <h1 className="brand-title">Kompilator Figma-to-Code</h1>
        </div>

        <nav className="tab-nav">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'tokens' ? 'active' : ''}`}
            onClick={() => setActiveTab('tokens')}
          >
            1. Tokeny z Figmy
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'vision' ? 'active' : ''}`}
            onClick={() => setActiveTab('vision')}
          >
            2. AI Kompilator Designu
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'figma-html' ? 'active' : ''}`}
            onClick={() => setActiveTab('figma-html')}
          >
            3. Figma do HTML
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'tokens' && (
          <TabTokens
            figmaFileKey={figmaFileKey}
            setFigmaFileKey={setFigmaFileKey}
            figmaToken={figmaToken}
            setFigmaToken={setFigmaToken}
          />
        )}

        {activeTab === 'vision' && (
          <TabCompiler
            geminiKey={geminiKey}
            setGeminiKey={setGeminiKey}
          />
        )}

        {activeTab === 'figma-html' && (
          <TabFigmaHTML
            figmaFileKey={figmaFileKey}
            setFigmaFileKey={setFigmaFileKey}
            figmaToken={figmaToken}
            setFigmaToken={setFigmaToken}
          />
        )}
      </main>
    </div>
  );
}
