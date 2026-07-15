import React from 'react';
import Card from './Card';
import { CARD_DATABASE } from '../utils/gameState';

export function StartScreen({ onStartGame }) {
  return (
    <div className="menu-screen">
      <h1 className="menu-title">ARCANE CARDS</h1>
      <p className="menu-subtitle">A Lite Roguelike Deck-builder</p>
      
      <div className="glass-panel" style={{ padding: '25px', maxWidth: '500px', marginBottom: '30px', border: '1px solid rgba(157, 78, 221, 0.3)' }}>
        <h3 style={{ fontFamily: 'var(--font-header)', color: 'var(--accent-cyan)', marginBottom: '10px' }}>Instructions</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', lineHeight: '1.5', textAlign: 'left' }}>
          • Defeat enemies to climb the floors.<br />
          • Play cards by consuming <b>Energy</b>. <br />
          • Study enemy <b>Intents</b> above them to decide when to attack or build shield.<br />
          • Add new cards to your deck after every victory.<br />
          • Survive floor 4 to claim ultimate victory!
        </p>
      </div>

      <button className="menu-btn" onClick={onStartGame}>
        Enter Dungeon
      </button>
    </div>
  );
}

export function RewardScreen({ cardOptions, onSelectCard, onSkip }) {
  return (
    <div className="reward-screen">
      <h2 className="reward-title">VICTORY!</h2>
      <p className="reward-subtitle">Choose a card to add to your deck:</p>
      
      <div className="card-options">
        {cardOptions.map((cardId) => {
          const card = CARD_DATABASE[cardId];
          return (
            <div key={cardId} className="reward-card-container">
              <Card card={card} selected={false} onClick={() => onSelectCard(cardId)} />
            </div>
          );
        })}
      </div>

      <button className="skip-btn" onClick={onSkip}>
        Skip & Proceed
      </button>
    </div>
  );
}

export function GameOverScreen({ floor, onRestart }) {
  return (
    <div className="game-over-screen">
      <h1 className="game-over-title">DEFEATED</h1>
      <p className="menu-subtitle" style={{ color: '#ff4d4d' }}>You perished on Floor {floor}</p>
      
      <button className="menu-btn" style={{ background: 'linear-gradient(135deg, #ef233c, #d90429)', boxShadow: '0 0 15px rgba(239, 35, 60, 0.6)' }} onClick={onRestart}>
        Try Again
      </button>
    </div>
  );
}

export function VictoryScreen({ onRestart }) {
  return (
    <div className="victory-screen">
      <h1 className="victory-title">Dungeon Cleared!</h1>
      <p className="menu-subtitle" style={{ color: 'var(--accent-cyan)' }}>You have vanquished the final boss and escaped the dungeon.</p>
      
      <button className="menu-btn" style={{ background: 'linear-gradient(135deg, var(--accent-cyan), #00bbf9)', boxShadow: 'var(--glow-cyan)' }} onClick={onRestart}>
        Return to Tavern
      </button>
    </div>
  );
}

export function DeckModal({ deck, onClose }) {
  return (
    <div className="deck-modal">
      <div className="modal-header">
        <h2 className="modal-title">Your Current Deck ({deck.length})</h2>
        <button className="small-btn" onClick={onClose} style={{ padding: '8px 20px', background: 'var(--color-attack)', color: '#fff' }}>
          Close
        </button>
      </div>

      <div className="deck-grid">
        {deck.map((cardId, index) => {
          const card = CARD_DATABASE[cardId];
          return (
            <Card
              key={`${cardId}-${index}`}
              card={card}
              selected={false}
              onClick={() => {}}
            />
          );
        })}
      </div>
    </div>
  );
}
