import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Chess from './components/Chess';
import CandyCrush from './components/CandyCrush';
import Ludo from './components/Ludo';

const GAME_TITLES = {
  CHESS: 'Chess AI Royale',
  MATCH3: 'Gem Crush AI',
  LUDO: 'Ludo AI Classic'
};

const PROVIDER_INFO = {
  local: {
    name: 'Nova Local AI (Free & Offline)',
    model: 'Built-in Heuristics',
    site: '#',
    desc: 'Runs entirely in your browser using intelligent board analyzers. 100% free, private, and requires no API keys or internet connection.'
  },
  gemini: {
    name: 'Google Gemini (Free Tier)',
    model: 'gemini-1.5-flash',
    site: 'https://aistudio.google.com/',
    desc: 'Google Gemini API is free for developers. Requires a free developer API key from Google AI Studio.'
  },
  groq: {
    name: 'Groq Cloud (Free Tier)',
    model: 'llama-3.1-8b-instant',
    site: 'https://console.groq.com/',
    desc: 'Groq Cloud provides free-tier access to Llama 3 models with ultra-fast responses. Requires a free Groq key.'
  },
  openrouter: {
    name: 'OpenRouter Free LLMs',
    model: 'llama-3-8b:free',
    site: 'https://openrouter.ai/',
    desc: 'OpenRouter offers multiple free open-source models with no credit card required. Requires an OpenRouter API key.'
  }
};

const callAIProvider = async (provider, apiKey, prompt) => {
  if (provider === 'local') {
    // Local provider returns fallback immediately, handled component-side
    return "";
  }

  if (!apiKey) throw new Error("No API key configured for this provider");

  if (provider === 'gemini') {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await res.json();
    if (data?.error) {
      throw new Error(data.error.message);
    }
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
  }

  if (provider === 'groq') {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    if (data?.error) {
      throw new Error(data.error.message);
    }
    return data?.choices?.[0]?.message?.content || "No response received.";
  }

  if (provider === 'openrouter') {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3-8b-instruct:free',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    if (data?.error) {
      throw new Error(data.error.message);
    }
    return data?.choices?.[0]?.message?.content || "No response received.";
  }

  throw new Error("Unknown AI Provider");
};

export default function App() {
  const [activeGame, setActiveGame] = useState(null); // null, CHESS, MATCH3, LUDO
  const [aiProvider, setAIProvider] = useState(() => localStorage.getItem('ai_provider') || 'local');
  const [keys, setKeys] = useState(() => ({
    gemini: localStorage.getItem('gemini_api_key') || '',
    groq: localStorage.getItem('groq_api_key') || '',
    openrouter: localStorage.getItem('openrouter_api_key') || ''
  }));
  const [tempProvider, setTempProvider] = useState('local');
  const [tempKey, setTempKey] = useState('');
  const [showAIModal, setShowAIModal] = useState(false);

  const isOnline = aiProvider === 'local' || !!keys[aiProvider];

  const handleSaveAIConfig = () => {
    localStorage.setItem('ai_provider', tempProvider);
    if (tempProvider !== 'local') {
      localStorage.setItem(`${tempProvider}_api_key`, tempKey.trim());
      setKeys((prev) => ({
        ...prev,
        [tempProvider]: tempKey.trim()
      }));
    }
    setAIProvider(tempProvider);
    setShowAIModal(false);
  };

  const handleOpenModal = () => {
    setTempProvider(aiProvider);
    setTempKey(keys[aiProvider] || '');
    setShowAIModal(true);
  };

  const handleProviderChangeInModal = (p) => {
    setTempProvider(p);
    setTempKey(keys[p] || '');
  };

  const handleDisconnect = () => {
    localStorage.removeItem(`${tempProvider}_api_key`);
    setKeys((prev) => ({
      ...prev,
      [tempProvider]: ''
    }));
    setTempKey('');
  };

  const requestAI = async (prompt) => {
    if (aiProvider === 'local') return ""; // Handled component-side
    const key = keys[aiProvider];
    return await callAIProvider(aiProvider, key, prompt);
  };

  const renderGameContent = () => {
    // Treat as offline if local, or if we have key
    const hasActiveKey = aiProvider === 'local' ? '' : keys[aiProvider];
    return (
      <>
        {activeGame === 'CHESS' && (
          <Chess geminiKey={hasActiveKey} requestAI={requestAI} aiProviderName={PROVIDER_INFO[aiProvider].name} />
        )}
        {activeGame === 'MATCH3' && (
          <CandyCrush geminiKey={hasActiveKey} requestAI={requestAI} aiProviderName={PROVIDER_INFO[aiProvider].name} />
        )}
        {activeGame === 'LUDO' && (
          <Ludo geminiKey={hasActiveKey} requestAI={requestAI} aiProviderName={PROVIDER_INFO[aiProvider].name} />
        )}
        {activeGame === null && (
          <Dashboard onSelectGame={setActiveGame} />
        )}
      </>
    );
  };

  return (
    <>
      <div className="app-bg" aria-hidden="true" />

      <div className="game-container">
        <header className="arcade-header">
          <div
            className="arcade-brand"
            onClick={() => setActiveGame(null)}
            style={{ cursor: 'pointer' }}
          >
            <div className="brand-mark">🧠</div>
            <h1 className="arcade-title">
              {activeGame ? GAME_TITLES[activeGame] : 'Nova AI Arcade'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* AI Status Badge */}
            <button
              onClick={handleOpenModal}
              className={`ai-status-badge ${isOnline ? 'online' : 'offline'}`}
              aria-label="Configure AI settings"
            >
              <span className="dot"></span>
              {isOnline ? `AI: ${tempProvider === 'local' ? 'LOCAL' : tempProvider.toUpperCase()}` : 'CONNECT CLOUD AI'}
            </button>

            {activeGame !== null && (
              <button className="back-btn" onClick={() => setActiveGame(null)}>
                ← Arcade
              </button>
            )}
          </div>
        </header>

        {renderGameContent()}
      </div>

      {/* AI Config Modal */}
      {showAIModal && (
        <div className="modal-overlay" style={{ zIndex: 999 }}>
          <div className="overlay-card glass-panel" style={{ maxWidth: '460px', textAlign: 'left', padding: '24px' }}>
            <div className="overlay-title" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              🧠 AI Engine Setup
            </div>
            <p className="overlay-sub" style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: '1.4', marginBottom: '16px' }}>
              Configure your preferred game advisor engine. By default, <strong>Nova Local AI</strong> operates 100% offline and keyless.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: 'var(--muted)', marginBottom: '8px' }}>
                Select AI Engine
              </label>
              <select
                value={tempProvider}
                onChange={(e) => handleProviderChangeInModal(e.target.value)}
                className="setup-input"
                style={{ width: '100%', background: '#1e293b', border: '1px solid var(--stroke)', padding: '10px', color: '#fff', borderRadius: '8px' }}
              >
                <option value="local">Nova Local Heuristic AI (Free &amp; Offline)</option>
                <option value="groq">Groq Cloud AI (Llama 3.1 8B - Free Cloud)</option>
                <option value="openrouter">OpenRouter Free LLMs (Gemma / Llama - Free Cloud)</option>
                <option value="gemini">Google Gemini AI (1.5 Flash - Free Cloud)</option>
              </select>
            </div>

            <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--cyan)', margin: 0, fontWeight: 700 }}>
                {PROVIDER_INFO[tempProvider].name}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '4px 0 10px', lineHeight: '1.3' }}>
                {PROVIDER_INFO[tempProvider].desc}
              </p>
              {tempProvider !== 'local' && (
                <a
                  href={PROVIDER_INFO[tempProvider].site}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.78rem', color: '#60a5fa', textDecoration: 'underline', fontWeight: 600 }}
                >
                  Get your Free API Key here ↗
                </a>
              )}
            </div>

            {tempProvider !== 'local' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: 'var(--muted)', marginBottom: '8px' }}>
                  API Key for {tempProvider.toUpperCase()}
                </label>
                <input
                  type="password"
                  placeholder="Paste API Key here..."
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  className="setup-input"
                  style={{ width: '100%' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {tempProvider !== 'local' && keys[tempProvider] && (
                <button className="chess-btn danger" onClick={handleDisconnect} style={{ marginRight: 'auto' }}>
                  Disconnect
                </button>
              )}
              <button className="chess-btn" onClick={() => setShowAIModal(false)}>
                Cancel
              </button>
              <button className="menu-btn" onClick={handleSaveAIConfig}>
                Save &amp; Connect ⚡
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
