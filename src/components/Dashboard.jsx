import React, { useState, useEffect } from 'react';

const ARCADE_GAMES = [
  {
    id: 'CHESS',
    title: 'Chess Royale',
    description:
      'The timeless game of strategy. Full move validation, capture highlights, pawn promotion and a beautifully classic board.',
    icon: '♞',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    glow: 'rgba(139, 92, 246, 0.8)',
    meta: ['2 Players', 'Strategy', '2D / 3D'],
    quote: '“Chess is the gymnasium of the mind. Every pawn is a potential queen.” — Blaise Pascal'
  },
  {
    id: 'MATCH3',
    title: 'Gem Crush',
    description:
      'Swap sparkling gems to line up 3 or more. Trigger satisfying cascades, chase your best score before the moves run out.',
    icon: '💎',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    glow: 'rgba(34, 211, 238, 0.8)',
    meta: ['Solo', 'Puzzle', '25 Moves'],
    quote: '“Life is sweet, make it a match-3 cascade! Find the color patterns in the chaos.” — Arcade Wisdom'
  },
  {
    id: 'LUDO',
    title: 'Ludo Classic',
    description:
      'The classic cross-board race. Roll the dice, escape the yard, guard the safe stars and send your rivals home.',
    icon: '🎲',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    glow: 'rgba(251, 191, 36, 0.8)',
    meta: ['2–4 Players', 'Board Game', 'AI Bots'],
    quote: '“Life is like Ludo: you roll, you move, and sometimes you get sent back, but the goal is always home.” — Ancient Proverb'
  }
];

export default function Dashboard({ onSelectGame }) {
  const [hoveredGameId, setHoveredGameId] = useState(null);
  const [activeQuoteIdx, setActiveQuoteIdx] = useState(0);

  useEffect(() => {
    if (hoveredGameId !== null) return;
    const interval = setInterval(() => {
      setActiveQuoteIdx((prev) => (prev + 1) % ARCADE_GAMES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [hoveredGameId]);

  const getActiveQuote = () => {
    if (hoveredGameId !== null) {
      const g = ARCADE_GAMES.find((game) => game.id === hoveredGameId);
      return g ? g.quote : '';
    }
    return ARCADE_GAMES[activeQuoteIdx].quote;
  };

  return (
    <div className="dashboard-screen">
      <div className="dashboard-eyebrow">
        <span className="dot" />
        Game Hub · 3 Games Ready
      </div>

      <h1 className="dashboard-logo">
        Play the Classics,
        <br />
        Reimagined.
      </h1>

      <p className="dashboard-tagline">
        A hand-crafted collection of timeless games with a modern, fluid
        interface. Pick a card and start playing — no downloads, no sign-ups.
      </p>

      <div className="games-grid">
        {ARCADE_GAMES.map((game) => (
          <div
            key={game.id}
            className="game-card"
            onClick={() => onSelectGame(game.id)}
            onMouseEnter={() => setHoveredGameId(game.id)}
            onMouseLeave={() => setHoveredGameId(null)}
          >
            <div
              className="game-card-glow"
              style={{ background: game.glow }}
            />
            <div
              className="game-card-icon"
              style={{ background: game.gradient }}
            >
              {game.icon}
            </div>
            <h2 className="game-card-title">{game.title}</h2>
            <p className="game-card-desc">{game.description}</p>

            <div className="game-card-meta">
              {game.meta.map((m) => (
                <span key={m} className="meta-chip">
                  {m}
                </span>
              ))}
            </div>

            <button
              className="play-action-btn"
              style={{ background: game.gradient }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectGame(game.id);
              }}
            >
              Play Now <span className="arrow">→</span>
            </button>
          </div>
        ))}
      </div>

      {/* Styled interactive quote panel */}
      <div className="dashboard-quote-panel glass-panel animate-fadeIn">
        <span className="quote-glow-icon">💬</span>
        <p className="quote-text">{getActiveQuote()}</p>
      </div>
    </div>
  );
}
