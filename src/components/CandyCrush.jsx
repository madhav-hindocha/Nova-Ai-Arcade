import React, { useState, useEffect, useCallback, useRef } from 'react';

const GEM_ICONS = ['💎', '🍇', '🍊', '🍎', '🍏', '🍒', '🌟'];
const GEM_COLORS = [
  'linear-gradient(145deg, rgba(34, 211, 238, 0.32), rgba(34, 211, 238, 0.08))',
  'linear-gradient(145deg, rgba(139, 92, 246, 0.32), rgba(139, 92, 246, 0.08))',
  'linear-gradient(145deg, rgba(251, 191, 36, 0.32), rgba(251, 191, 36, 0.08))',
  'linear-gradient(145deg, rgba(248, 113, 113, 0.32), rgba(248, 113, 113, 0.08))',
  'linear-gradient(145deg, rgba(52, 211, 153, 0.32), rgba(52, 211, 153, 0.08))',
  'linear-gradient(145deg, rgba(236, 72, 153, 0.32), rgba(236, 72, 153, 0.08))',
  'linear-gradient(145deg, rgba(251, 146, 60, 0.32), rgba(251, 146, 60, 0.08))'
];
const GEM_BORDERS = [
  'rgba(34, 211, 238, 0.45)',
  'rgba(139, 92, 246, 0.45)',
  'rgba(251, 191, 36, 0.45)',
  'rgba(248, 113, 113, 0.45)',
  'rgba(52, 211, 153, 0.45)',
  'rgba(236, 72, 153, 0.45)',
  'rgba(251, 146, 60, 0.45)'
];

const BOARD_SIZE = 7;

// Generate Level config dynamically (1 to 20)
const getLevelConfig = (levelNum) => {
  const targetScore = levelNum * 900 + 300;
  const moves = Math.max(12, 33 - Math.floor(levelNum / 1.15));
  
  let gemCount = 4;
  if (levelNum >= 5) gemCount = 5;
  if (levelNum >= 10) gemCount = 6;
  if (levelNum >= 15) gemCount = 7;

  let goalType = 'score';
  let targetGems = [];

  const remainder = levelNum % 4;
  if (remainder === 1) {
    goalType = 'score';
  } else if (remainder === 2) {
    goalType = 'gems';
    const typeIdx = (levelNum * 3) % gemCount;
    targetGems = [{ type: typeIdx, count: 12 + levelNum * 2 }];
  } else if (remainder === 3) {
    goalType = 'gems';
    const type1 = (levelNum) % gemCount;
    let type2 = (levelNum + 2) % gemCount;
    if (type1 === type2) type2 = (type1 + 1) % gemCount;
    targetGems = [
      { type: type1, count: 8 + levelNum },
      { type: type2, count: 8 + levelNum }
    ];
  } else {
    goalType = 'mixed';
    const typeIdx = (levelNum * 2) % gemCount;
    targetGems = [{ type: typeIdx, count: 10 + levelNum }];
  }

  return {
    targetScore,
    moves,
    gemCount,
    goalType,
    targetGems
  };
};

export default function CandyCrush({ geminiKey, requestAI, aiProviderName }) {
  const [level, setLevel] = useState(1);
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [unlockedLevel, setUnlockedLevel] = useState(() => {
    try {
      const saved = localStorage.getItem('gemcrush_unlocked_level');
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });
  const [screen, setScreen] = useState('LEVEL_SELECT');
  const [previewLevel, setPreviewLevel] = useState(null);

  const [board, setBoard] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(25);
  const [goalProgress, setGoalProgress] = useState({});
  const [hasWon, setHasWon] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fallingIdxs, setFallingIdxs] = useState([]);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    // Set initial preview level to unlocked level
    setPreviewLevel(unlockedLevel <= 20 ? unlockedLevel : 20);
    return () => {
      isMounted.current = false;
    };
  }, [unlockedLevel]);

  const activeConfig = getLevelConfig(level);

  // Victory Condition Monitoring
  useEffect(() => {
    if (screen !== 'GAMEPLAY' || isProcessing || hasWon) return;

    let isGoalMet = false;
    if (activeConfig.goalType === 'score') {
      isGoalMet = score >= activeConfig.targetScore;
    } else if (activeConfig.goalType === 'gems') {
      isGoalMet = activeConfig.targetGems.every(
        (g) => (goalProgress[g.type] || 0) >= g.count
      );
    } else if (activeConfig.goalType === 'mixed') {
      const scoreMet = score >= activeConfig.targetScore;
      const gemsMet = activeConfig.targetGems.every(
        (g) => (goalProgress[g.type] || 0) >= g.count
      );
      isGoalMet = scoreMet && gemsMet;
    }

    if (isGoalMet) {
      setHasWon(true);
      if (level === unlockedLevel && level < 20) {
        const nextL = level + 1;
        setUnlockedLevel(nextL);
        try {
          localStorage.setItem('gemcrush_unlocked_level', nextL.toString());
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [score, goalProgress, isProcessing, activeConfig, level, unlockedLevel, screen, hasWon]);

  // Board initialization
  const initBoardForLevel = useCallback((levelNum) => {
    // Shake seed using time
    const shake = Date.now() % 50;
    for (let s = 0; s < shake; s++) {
      Math.random();
    }

    const cfg = getLevelConfig(levelNum);
    const poolSize = cfg.gemCount;

    let newBoard = [];
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
      let randGem;
      do {
        randGem = Math.floor(Math.random() * poolSize);
      } while (
        (i % BOARD_SIZE >= 2 && newBoard[i - 1] === randGem && newBoard[i - 2] === randGem) ||
        (i >= BOARD_SIZE * 2 && newBoard[i - BOARD_SIZE] === randGem && newBoard[i - BOARD_SIZE * 2] === randGem)
      );
      newBoard.push(randGem);
    }

    setBoard(newBoard);
    setScore(0);
    setMovesLeft(cfg.moves);
    setGoalProgress({});
    setHasWon(false);
    setSelectedIdx(null);
    setIsProcessing(false);
    setFallingIdxs([]);
  }, []);



  const getLocalCandyCrushHint = () => {
    const GEM_NAMES = ['💎 Diamond', '🍇 Grapes', '🍊 Orange', '🍎 Red Apple', '🍏 Green Apple', '🍒 Cherry', '🌟 Star'];
    
    const testSwap = (idx1, idx2) => {
      if (idx1 < 0 || idx1 >= BOARD_SIZE * BOARD_SIZE || idx2 < 0 || idx2 >= BOARD_SIZE * BOARD_SIZE) return null;
      const copy = [...board];
      const temp = copy[idx1];
      copy[idx1] = copy[idx2];
      copy[idx2] = temp;
      
      const matches = findMatches(copy);
      // Verify match actually involves one of the swapped items to prevent false positives from pre-existing matches
      if (matches.includes(idx1) || matches.includes(idx2)) {
        if (matches.includes(idx1)) return copy[idx1];
        return copy[idx2];
      }
      return null;
    };

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const idx = r * BOARD_SIZE + c;
        if (c < BOARD_SIZE - 1) {
          const matchedGem = testSwap(idx, idx + 1);
          if (matchedGem !== null) {
            const name = GEM_NAMES[matchedGem] || 'Gems';
            return `Offline Assist: Swap Row ${r + 1} Col ${c + 1} with Row ${r + 1} Col ${c + 2} to match ${name}!`;
          }
        }
        if (r < BOARD_SIZE - 1) {
          const matchedGem = testSwap(idx, idx + BOARD_SIZE);
          if (matchedGem !== null) {
            const name = GEM_NAMES[matchedGem] || 'Gems';
            return `Offline Assist: Swap Row ${r + 1} Col ${c + 1} with Row ${r + 2} Col ${c + 1} to match ${name}!`;
          }
        }
      }
    }

    return "Offline Assist: No immediate swaps found. Try matching other adjacent gems to trigger drops!";
  };

  const askGeminiForHint = async () => {
    setLoadingAI(true);
    setAiResponse('AI is thinking...');

    const localHint = getLocalCandyCrushHint();

    if (!geminiKey) {
      setTimeout(() => {
        if (isMounted.current) {
          setAiResponse(localHint);
          setLoadingAI(false);
        }
      }, 700);
      return;
    }

    const GEM_NAMES = ['🍎 Apple', '🍌 Banana', '🍇 Grapes', '🍉 Watermelon', '🍊 Orange', '🍒 Cherry', '🌟 Star'];
    const rows = [];
    for (let r = 0; r < 8; r++) {
      const rowGems = [];
      for (let c = 0; c < 8; c++) {
        const val = board[r * 8 + c];
        rowGems.push(GEM_NAMES[val] || 'Empty');
      }
      rows.push(`Row ${r}: ` + rowGems.join(', '));
    }
    const gridString = rows.join('\n');

    let goalStr = '';
    if (activeConfig.goalType === 'score') {
      goalStr = `Reach score ${activeConfig.targetScore} (Current: ${score})`;
    } else if (activeConfig.goalType === 'gems') {
      goalStr = 'Collect target gems';
    } else {
      goalStr = `Score & gems combined (Current Score: ${score})`;
    }

    const prompt = `You are a Candy Crush helper AI. The current 8x8 grid contains:
${gridString}

Level goal: ${goalStr}
Moves remaining: ${movesLeft}

Suggest a specific swap (e.g., 'Swap Row 2 Col 3 with Row 3 Col 3') that creates a match-3, match-4, or match-5 combination, and explain briefly why in 1 sentence. Keep the response under 25 words total.`;

    try {
      const text = await requestAI(prompt);
      setAiResponse(text);
    } catch (err) {
      console.error(err);
      setAiResponse(`AI Engine offline (using Local AI Assist fallback).\n${localHint}`);
    } finally {
      setLoadingAI(false);
    }
  };

  // Scan board matches
  const findMatches = (currentBoard) => {
    const matches = new Set();

    // Check rows
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE - 2; c++) {
        const idx = r * BOARD_SIZE + c;
        const gem = currentBoard[idx];
        if (gem !== null && gem === currentBoard[idx + 1] && gem === currentBoard[idx + 2]) {
          matches.add(idx);
          matches.add(idx + 1);
          matches.add(idx + 2);
        }
      }
    }

    // Check columns
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = 0; r < BOARD_SIZE - 2; r++) {
        const idx = r * BOARD_SIZE + c;
        const gem = currentBoard[idx];
        if (gem !== null && gem === currentBoard[idx + BOARD_SIZE] && gem === currentBoard[idx + BOARD_SIZE * 2]) {
          matches.add(idx);
          matches.add(idx + BOARD_SIZE);
          matches.add(idx + BOARD_SIZE * 2);
        }
      }
    }

    return Array.from(matches);
  };

  // Falling/Cascade loops
  const processCascades = useCallback(async (tempBoard) => {
    setIsProcessing(true);
    let currentBoard = [...tempBoard];
    let matchedIndices = findMatches(currentBoard);

    if (matchedIndices.length === 0) {
      setIsProcessing(false);
      return;
    }

    // Clear cells and collect goals progress
    const matchesByGemType = {};
    matchedIndices.forEach((idx) => {
      const type = currentBoard[idx];
      if (type !== null) {
        matchesByGemType[type] = (matchesByGemType[type] || 0) + 1;
      }
      currentBoard[idx] = null;
    });

    if (Object.keys(matchesByGemType).length > 0) {
      setGoalProgress((prev) => {
        const next = { ...prev };
        Object.keys(matchesByGemType).forEach((type) => {
          next[type] = (next[type] || 0) + matchesByGemType[type];
        });
        return next;
      });
    }

    if (!isMounted.current) return;
    setBoard([...currentBoard]);
    setScore((prev) => prev + matchedIndices.length * 10);
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (!isMounted.current) return;

    // Drop logic
    const droppedIndices = [];
    const poolSize = activeConfig.gemCount;

    for (let c = 0; c < BOARD_SIZE; c++) {
      const columnGems = [];
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        const idx = r * BOARD_SIZE + c;
        if (currentBoard[idx] !== null) {
          columnGems.push(currentBoard[idx]);
        }
      }

      while (columnGems.length < BOARD_SIZE) {
        columnGems.push(Math.floor(Math.random() * poolSize));
      }

      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        const idx = r * BOARD_SIZE + c;
        const oldGem = currentBoard[idx];
        currentBoard[idx] = columnGems[BOARD_SIZE - 1 - r];
        
        if (oldGem === null) {
          droppedIndices.push(idx);
        }
      }
    }

    if (!isMounted.current) return;
    setFallingIdxs(droppedIndices);
    setBoard([...currentBoard]);
    await new Promise((resolve) => setTimeout(resolve, 380));
    if (!isMounted.current) return;
    setFallingIdxs([]);

    processCascades(currentBoard);
  }, [activeConfig.gemCount]);

  const handleGemClick = async (idx) => {
    if (isProcessing || movesLeft <= 0 || hasWon) return;

    if (selectedIdx === null) {
      setSelectedIdx(idx);
    } else {
      const prevIdx = selectedIdx;
      setSelectedIdx(null);

      const prevR = Math.floor(prevIdx / BOARD_SIZE);
      const prevC = prevIdx % BOARD_SIZE;
      const currR = Math.floor(idx / BOARD_SIZE);
      const currC = idx % BOARD_SIZE;

      const isAdjacent = Math.abs(prevR - currR) + Math.abs(prevC - currC) === 1;

      if (isAdjacent) {
        const tempBoard = [...board];
        const tempGem = tempBoard[prevIdx];
        tempBoard[prevIdx] = tempBoard[idx];
        tempBoard[idx] = tempGem;

        const matches = findMatches(tempBoard);

        if (matches.length > 0) {
          setMovesLeft((prev) => prev - 1);
          setBoard(tempBoard);
          processCascades(tempBoard);
        } else {
          setBoard(tempBoard);
          setIsProcessing(true);
          await new Promise((resolve) => setTimeout(resolve, 200));
          if (!isMounted.current) return;
          
          const revertedBoard = [...tempBoard];
          revertedBoard[idx] = revertedBoard[prevIdx];
          revertedBoard[prevIdx] = tempGem;
          
          setBoard(revertedBoard);
          setIsProcessing(false);
        }
      }
    }
  };

  const boardContent = (
    <div className="match3-board">
      {board.map((gemType, idx) => {
        const isSelected = selectedIdx === idx;
        const isMatched = gemType === null;
        const isFalling = fallingIdxs.includes(idx);

        return (
          <div
            key={idx}
            className={`match3-gem ${isSelected ? 'selected' : ''} ${isMatched ? 'matched' : ''} ${isFalling ? 'falling' : ''}`}
            style={{
              background: isMatched ? 'transparent' : GEM_COLORS[gemType],
              borderColor: isMatched ? 'transparent' : GEM_BORDERS[gemType],
            }}
            onClick={() => handleGemClick(idx)}
          >
            {!isMatched && GEM_ICONS[gemType]}
          </div>
        );
      })}
    </div>
  );

  const isGameOver = movesLeft <= 0 && !isProcessing;

  const framedBoard = (
    <div className="match3-frame">
      {boardContent}

      {/* Victory overlay */}
      {hasWon && (
        <div className="match3-overlay">
          <h2 style={{ background: 'var(--grad-green)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Level {level} Cleared! 🎉
          </h2>
          <p>Fantastic job! Objectives met.</p>
          <p style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>Score: {score}</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            <button className="menu-btn" onClick={() => setScreen('LEVEL_SELECT')}>
              Levels
            </button>
            {level < 20 ? (
              <button
                className="menu-btn"
                style={{ background: 'var(--grad-primary)' }}
                onClick={() => {
                  const nextL = level + 1;
                  setLevel(nextL);
                  setPreviewLevel(nextL);
                  initBoardForLevel(nextL);
                }}
              >
                Level {level + 1} →
              </button>
            ) : (
              <span style={{ color: 'var(--amber)', fontWeight: 700, padding: '10px 0' }}>
                All levels beaten! 🏆
              </span>
            )}
          </div>
        </div>
      )}

      {/* Defeat overlay */}
      {isGameOver && !hasWon && (
        <div className="match3-overlay">
          <h2>Out of Moves! 😢</h2>
          <p>Objectives were not met.</p>
          <p>Score: <b style={{ color: '#fff' }}>{score}</b></p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            <button className="menu-btn" onClick={() => setScreen('LEVEL_SELECT')}>
              Levels Grid
            </button>
            <button className="menu-btn" onClick={() => initBoardForLevel(level)}>
              Try Again ↻
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="match3-container">
      {screen === 'LEVEL_SELECT' ? (
        /* LEVEL SELECT SCREEN */
        <div className="match3-level-select">
          <h2 className="level-select-title">GEM CRUSH LEVELS</h2>
          <p className="level-select-sub">Unlock levels by completing dynamic match goals</p>
          
          <div className="level-grid">
            {Array.from({ length: 20 }).map((_, idx) => {
              const lvlNum = idx + 1;
              const isUnlocked = lvlNum <= unlockedLevel;
              const isCompleted = lvlNum < unlockedLevel;

              return (
                <button
                  key={lvlNum}
                  className={`level-card ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''}`}
                  disabled={!isUnlocked}
                  onClick={() => {
                    setPreviewLevel(lvlNum);
                  }}
                  style={{
                    borderColor: previewLevel === lvlNum ? 'var(--cyan)' : undefined,
                    boxShadow: previewLevel === lvlNum ? '0 0 12px var(--cyan)' : undefined
                  }}
                >
                  {lvlNum}
                  {isCompleted && <span className="level-card-badge">✓</span>}
                  {!isUnlocked && <span className="lock-icon">🔒</span>}
                </button>
              );
            })}
          </div>

          {/* Level Details Panel */}
          {previewLevel !== null && (
            <div className="level-info-overlay">
              <div className="level-info-title">Level {previewLevel} Preview</div>
              {(() => {
                const cfg = getLevelConfig(previewLevel);
                return (
                  <>
                    <div style={{ fontSize: '0.86rem', color: 'var(--muted)', margin: '4px 0 10px' }}>
                      Objectives to beat the level:
                    </div>
                    <div className="level-info-goals">
                      {cfg.goalType !== 'gems' && (
                        <span className="match3-goal-item">
                          🏆 Target Score: <b>{cfg.targetScore}</b>
                        </span>
                      )}
                      {cfg.targetGems.map((g, i) => (
                        <span key={i} className="match3-goal-item">
                          {GEM_ICONS[g.type]} Collect {g.count}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>
                      Moves: <b>{cfg.moves}</b> · Gem Colors: <b>{cfg.gemCount}</b>
                    </div>
                    <button
                      className="menu-btn"
                      style={{ marginTop: '16px', background: 'var(--grad-primary)', padding: '10px 24px' }}
                      onClick={() => {
                        setLevel(previewLevel);
                        setScreen('GAMEPLAY');
                        initBoardForLevel(previewLevel);
                      }}
                    >
                      Play Level {previewLevel} 🚀
                    </button>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      ) : (
        /* GAMEPLAY BOARD SCREEN */
        <>
          <div className="match3-stats">
            <div className="match3-stat-item">
              Level
              <span className="match3-stat-val" style={{ color: 'var(--cyan)' }}>{level}</span>
            </div>
            <div className="match3-stat-item">
              Moves Left
              <span className="match3-stat-val" style={{ color: movesLeft <= 5 ? '#f87171' : '#fff' }}>{movesLeft}</span>
            </div>
            <div className="match3-stat-item">
              Score
              <span className="match3-stat-val accent">{score}</span>
            </div>
            
            {/* Objectives progress HUD */}
            <div className="match3-stat-item" style={{ minWidth: '220px' }}>
              Objectives
              <div className="match3-goals-container" style={{ marginTop: '4px' }}>
                {activeConfig.goalType !== 'gems' && (
                  <div className={`match3-goal-item ${score >= activeConfig.targetScore ? 'completed' : ''}`}>
                    🏆 {score} / {activeConfig.targetScore}
                    {score >= activeConfig.targetScore && <span className="match3-goal-check"> ✓</span>}
                  </div>
                )}
                {activeConfig.targetGems.map((g, i) => {
                  const current = goalProgress[g.type] || 0;
                  const completed = current >= g.count;
                  return (
                    <div key={i} className={`match3-goal-item ${completed ? 'completed' : ''}`}>
                      {GEM_ICONS[g.type]} {current} / {g.count}
                      {completed && <span className="match3-goal-check"> ✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {framedBoard}

          {/* AI Helper Hint block */}
          <div className="ai-coach-panel" style={{ maxWidth: '560px', width: '92%', margin: '14px auto 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 800, color: 'var(--cyan)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {geminiKey ? `🧠 ${aiProviderName}` : '🧠 Offline Match Assist'}
              </span>
              <button
                className="ai-coach-btn"
                onClick={askGeminiForHint}
                disabled={loadingAI || movesLeft <= 0 || hasWon}
                style={{ padding: '6px 12px', fontSize: '0.72rem' }}
              >
                {loadingAI ? 'Calculating Matches…' : geminiKey ? `Ask ${aiProviderName} 💡` : 'Ask Local AI Assist 💡'}
              </button>
            </div>
            {aiResponse ? (
              <div className="ai-coach-bubble animate-fadeIn" style={{ fontSize: '0.82rem', lineHeight: '1.4', color: '#cbd5e1' }}>
                {aiResponse}
              </div>
            ) : (
              <div style={{ fontSize: '0.76rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                {geminiKey ? `Need a hint? Ask ${aiProviderName} to analyze the grid and find the best matching swap.` : 'Need a hint? Get an offline suggestion for a matching swap.'}
              </div>
            )}
          </div>

          <div className="chess-controls" style={{ marginTop: '20px' }}>
            <button className="chess-btn" onClick={() => {
              setScreen('LEVEL_SELECT');
              setAiResponse('');
            }}>
              ← Levels Grid
            </button>
            <button className="chess-btn" onClick={() => initBoardForLevel(level)}>
              ↻ Restart Level
            </button>
          </div>
        </>
      )}
    </div>
  );
}
