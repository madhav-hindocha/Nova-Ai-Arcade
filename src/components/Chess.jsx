import React, { useState, useEffect, useRef } from 'react';

const ChessIcon = ({ type }) => {
  switch (type) {
    case 'p':
      return (
        <svg viewBox="0 0 30 30" width="100%" height="100%">
          <g fill="var(--piece-fill)" stroke="var(--piece-stroke)" strokeWidth="1.5" strokeLinejoin="round">
            <circle cx="15" cy="8" r="4.2" />
            <path d="M15,12 C12,12 10.5,15.5 10.5,20 L19.5,20 C19.5,15.5 18,12 15,12 Z" />
            <rect x="9.5" y="21" width="11" height="2.2" rx="0.5" />
          </g>
        </svg>
      );
    case 'r':
      return (
        <svg viewBox="0 0 30 30" width="100%" height="100%">
          <g fill="var(--piece-fill)" stroke="var(--piece-stroke)" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M9,7 L9,11 L11,11 L11,9 L13,9 L13,11 L17,11 L17,9 L19,9 L19,11 L21,11 L21,7 Z" />
            <path d="M10.2,12 L19.8,12 L18.8,21 L11.2,21 Z" />
            <rect x="8.5" y="22" width="13" height="2.2" rx="0.5" />
          </g>
        </svg>
      );
    case 'n':
      return (
        <svg viewBox="0 0 30 30" width="100%" height="100%">
          <g fill="var(--piece-fill)" stroke="var(--piece-stroke)" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M10,23 L20,23 C21,18 20,13 18,10 C17,8 16,8 16,10 C15,9 14,9 14,11 C13,11 11,12 9,14 C8,15 8,16 9.5,16.5 C11,17 12,16 12,17.5 C10,19 9,20 10.5,21.5 C12,22.5 13,21.5 13,23 Z" />
            <rect x="9" y="24" width="12" height="2.2" rx="0.5" />
          </g>
        </svg>
      );
    case 'b':
      return (
        <svg viewBox="0 0 30 30" width="100%" height="100%">
          <g fill="var(--piece-fill)" stroke="var(--piece-stroke)" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M15,7 C12.2,9.8 11.2,12.5 11.2,18 L18.8,18 C18.8,12.5 17.8,9.8 15,7 Z" />
            <circle cx="15" cy="5.2" r="1.5" />
            <path d="M12.2,19 L17.8,19 L16.8,21 L13.2,21 Z" />
            <rect x="9.5" y="22" width="11" height="2.2" rx="0.5" />
          </g>
          <path d="M13.8,11.5 L16.2,13.5" stroke="var(--piece-stroke)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'q':
      return (
        <svg viewBox="0 0 30 30" width="100%" height="100%">
          <g fill="var(--piece-fill)" stroke="var(--piece-stroke)" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M9,9.5 L11,18 L19,18 L21,9.5 L17.5,14 L15,9 L12.5,14 Z" />
            <circle cx="9" cy="8.5" r="1" />
            <circle cx="12.5" cy="8.2" r="1" />
            <circle cx="15" cy="8" r="1.1" />
            <circle cx="17.5" cy="8.2" r="1" />
            <circle cx="21" cy="8.5" r="1" />
            <rect x="9.5" y="19.5" width="11" height="2" rx="0.5" />
            <rect x="8.5" y="22.5" width="13" height="2.2" rx="0.5" />
          </g>
        </svg>
      );
    case 'k':
      return (
        <svg viewBox="0 0 30 30" width="100%" height="100%">
          <g fill="var(--piece-fill)" stroke="var(--piece-stroke)" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M10,11 L11,19 L19,19 L20,11 L17.5,15 L15,10 L12.5,15 Z" />
            <rect x="9.5" y="20.5" width="11" height="2" rx="0.5" />
            <rect x="8.5" y="23.5" width="13" height="2.2" rx="0.5" />
          </g>
          <path d="M14,6 L16,6 M15,5 L15,8" stroke="var(--piece-stroke)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
};

const getInitialBoard = () => [
  [
    { type: 'r', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'q', color: 'b' },
    { type: 'k', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'r', color: 'b' }
  ],
  Array(8).fill(null).map(() => ({ type: 'p', color: 'b' })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null).map(() => ({ type: 'p', color: 'w' })),
  [
    { type: 'r', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'q', color: 'w' },
    { type: 'k', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'r', color: 'w' }
  ]
];

// Synth sounds for Chess
const playChessSound = (type, muted) => {
  if (muted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'select') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'move') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'capture') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'check') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      osc.frequency.setValueAtTime(640, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'victory') {
      const now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.15);
      osc.frequency.setValueAtTime(783.99, now + 0.3);
      osc.frequency.setValueAtTime(1046.50, now + 0.45);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.7);
      osc.start();
      osc.stop(now + 0.7);
    }
  } catch {
    // Sound error block safe
  }
};

export default function Chess({ geminiKey, requestAI, aiProviderName }) {
  const [gameState, setGameState] = useState('WELCOME');
  const [playerTypes, setPlayerTypes] = useState({ w: 'human', b: 'bot' });
  const [playerNames, setPlayerNames] = useState({ w: '', b: '' });
  const [showStartBanner, setShowStartBanner] = useState(false);

  const [aiResponse, setAiResponse] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const [board, setBoard] = useState(getInitialBoard);
  const [selectedPiece, setSelectedPiece] = useState(null); // { r, c }
  const [validMoves, setValidMoves] = useState([]); // [{ r, c }]
  const [turn, setTurn] = useState('w'); // 'w' or 'b' or 'over'
  const [status, setStatus] = useState("White's turn");
  const [lastMove, setLastMove] = useState(null); // { from: {r, c}, to: {r, c} }
  const [animatedPiece, setAnimatedPiece] = useState(null); // { r, c }
  const [captured, setCaptured] = useState({ w: [], b: [] }); // pieces captured BY each color
  const [gamePaused, setGamePaused] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Bot move logic trigger hook
  useEffect(() => {
    if (gameState === 'GAMEPLAY' && turn === 'b' && playerTypes.b === 'bot' && !gamePaused) {
      const timer = setTimeout(() => {
        if (isMounted.current) {
          triggerBotMove();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, gameState, gamePaused]);

  // Basic move checker
  const getMoves = (r, c, currentBoard) => {
    const piece = currentBoard[r][c];
    if (!piece) return [];
    
    const moves = [];
    const color = piece.color;
    const oppColor = color === 'w' ? 'b' : 'w';

    const addMove = (nr, nc) => {
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const dest = currentBoard[nr][nc];
        if (!dest) {
          moves.push({ r: nr, c: nc });
          return true; // continue checking in this direction
        } else if (dest.color === oppColor) {
          moves.push({ r: nr, c: nc });
          return false; // hit enemy, stop checking
        } else {
          return false; // hit ally, stop checking
        }
      }
      return false;
    };

    switch (piece.type) {
      case 'p': {
        const dir = color === 'w' ? -1 : 1;
        const startRow = color === 'w' ? 6 : 1;
        
        // Single step forward
        if (r + dir >= 0 && r + dir < 8 && !currentBoard[r + dir][c]) {
          moves.push({ r: r + dir, c });
          // Double step forward
          if (r === startRow && !currentBoard[r + dir][c] && !currentBoard[r + 2 * dir][c]) {
            moves.push({ r: r + 2 * dir, c });
          }
        }
        // Diagonal captures
        [-1, 1].forEach((dc) => {
          const nr = r + dir;
          const nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const dest = currentBoard[nr][nc];
            if (dest && dest.color === oppColor) {
              moves.push({ r: nr, c: nc });
            }
          }
        });
        break;
      }
      case 'r': {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        dirs.forEach(([dr, dc]) => {
          let step = 1;
          while (addMove(r + dr * step, c + dc * step)) {
            step++;
          }
        });
        break;
      }
      case 'b': {
        const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        dirs.forEach(([dr, dc]) => {
          let step = 1;
          while (addMove(r + dr * step, c + dc * step)) {
            step++;
          }
        });
        break;
      }
      case 'q': {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
        dirs.forEach(([dr, dc]) => {
          let step = 1;
          while (addMove(r + dr * step, c + dc * step)) {
            step++;
          }
        });
        break;
      }
      case 'n': {
        const jumps = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        jumps.forEach(([dr, dc]) => {
          addMove(r + dr, c + dc);
        });
        break;
      }
      case 'k': {
        const steps = [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1],           [0, 1],
          [1, -1],  [1, 0],  [1, 1]
        ];
        steps.forEach(([dr, dc]) => {
          addMove(r + dr, c + dc);
        });
        break;
      }
      default:
        break;
    }
    return moves;
  };

  const getPName = (color) => {
    const suffix = color === 'w' ? 'White' : 'Black';
    if (playerNames[color].trim()) return playerNames[color].trim();
    return playerTypes[color] === 'bot' ? `Bot (${suffix})` : suffix;
  };

  const startChessMatch = () => {
    setBoard(getInitialBoard());
    setSelectedPiece(null);
    setValidMoves([]);
    setTurn('w');
    setStatus(`${getPName('w')}'s turn`);
    setLastMove(null);
    setAnimatedPiece(null);
    setCaptured({ w: [], b: [] });
    setGameState('GAMEPLAY');
    setShowStartBanner(true);
    setTimeout(() => {
      if (isMounted.current) setShowStartBanner(false);
    }, 1800);
  };

  const startVsComputerWizard = () => {
    setPlayerTypes({ w: 'human', b: 'bot' });
    setPlayerNames({ w: 'Player 1', b: 'Gemini AI' });
    setGameState('SETUP_DETAILS');
  };

  const handleSquareClick = (r, c) => {
    if (gamePaused || turn === 'over') return;
    if (turn === 'b' && playerTypes.b === 'bot') return; // block clicking on bot's turn

    const isClickingValidMove = validMoves.some((m) => m.r === r && m.c === c);

    if (isClickingValidMove && selectedPiece) {
      executePieceMove(selectedPiece.r, selectedPiece.c, r, c);
    } else {
      const piece = board[r][c];
      if (piece && piece.color === turn) {
        setSelectedPiece({ r, c });
        setValidMoves(getMoves(r, c, board));
        playChessSound('select', soundMuted);
      } else {
        setSelectedPiece(null);
        setValidMoves([]);
      }
    }
  };

  const executePieceMove = (fromR, fromC, toR, toC) => {
    const newBoard = board.map((row) => [...row]);
    const movingPiece = newBoard[fromR][fromC];
    const targetPiece = newBoard[toR][toC];

    newBoard[toR][toC] = movingPiece;
    newBoard[fromR][fromC] = null;

    // Pawn promotion to Queen
    if (movingPiece.type === 'p' && (toR === 0 || toR === 7)) {
      newBoard[toR][toC] = { type: 'q', color: movingPiece.color };
    }

    setBoard(newBoard);
    setSelectedPiece(null);
    setValidMoves([]);

    // Record capture
    if (targetPiece) {
      playChessSound('capture', soundMuted);
      setCaptured((prev) => ({
        ...prev,
        [movingPiece.color]: [...prev[movingPiece.color], targetPiece]
      }));
    } else {
      playChessSound('move', soundMuted);
    }

    setLastMove({
      from: { r: fromR, c: fromC },
      to: { r: toR, c: toC }
    });
    setAnimatedPiece({ r: toR, c: toC });
    setTimeout(() => {
      if (isMounted.current) setAnimatedPiece(null);
    }, 350);

    // Check Win Condition (King Captured)
    if (targetPiece && targetPiece.type === 'k') {
      playChessSound('victory', soundMuted);
      setStatus(`${getPName(movingPiece.color)} Wins by King Capture!`);
      setTurn('over');
    } else {
      const nextTurn = movingPiece.color === 'w' ? 'b' : 'w';
      setTurn(nextTurn);
      setStatus(`${getPName(nextTurn)}'s turn`);
    }
  };

  // Heuristic Bot Calculations
  const triggerBotMove = () => {
    // Find all valid black moves
    const botMoves = [];
    const pieceValues = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 9000 };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === 'b') {
          const validDests = getMoves(r, c, board);
          validDests.forEach((dest) => {
            const target = board[dest.r][dest.c];
            let score = target ? pieceValues[target.type] * 10 : 0;

            // Basic positional weight (encourage center control)
            const distFromCenter = Math.abs(dest.r - 3.5) + Math.abs(dest.c - 3.5);
            score += (7 - distFromCenter) * 0.5;

            // Attack king priority
            if (target && target.type === 'k') score += 10000;

            botMoves.push({
              from: { r, c },
              to: dest,
              score: score + Math.random() * 2
            });
          });
        }
      }
    }

    if (botMoves.length === 0) {
      // King captured or draw - exit
      setStatus("No moves for AI - Game Over!");
      setTurn('over');
      return;
    }

    // Sort descending by score
    botMoves.sort((x, y) => y.score - x.score);
    const chosenMove = botMoves[0];

    executePieceMove(chosenMove.from.r, chosenMove.from.c, chosenMove.to.r, chosenMove.to.c);
  };

  const getLocalChessHint = () => {
    const activeColor = turn;
    const pieceValues = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 9000 };
    const pieceNames = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
    const colLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    const allMoves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === activeColor) {
          const moves = getMoves(r, c, board);
          moves.forEach((m) => {
            const target = board[m.r][m.c];
            let score = 0;
            if (target) {
              score = pieceValues[target.type] * 10 - pieceValues[piece.type];
            }
            if (m.r >= 3 && m.r <= 4 && m.c >= 3 && m.c <= 4) {
              score += 2;
            }
            allMoves.push({
              piece,
              from: { r, c },
              to: m,
              score,
              capture: target
            });
          });
        }
      }
    }

    if (allMoves.length === 0) {
      return "No valid moves available. It might be checkmate!";
    }

    allMoves.sort((x, y) => y.score - x.score);
    const best = allMoves[0];
    const fromLabel = `${colLabels[best.from.c]}${8 - best.from.r}`;
    const toLabel = `${colLabels[best.to.c]}${8 - best.to.r}`;
    const pieceName = pieceNames[best.piece.type];

    if (best.capture) {
      const capturedName = pieceNames[best.capture.type];
      return `Offline Coach: Capture the opponent's ${capturedName} at ${toLabel} with your ${pieceName} on ${fromLabel} to win material!`;
    }

    if (best.piece.type === 'p') {
      return `Offline Coach: Push your Pawn on ${fromLabel} to ${toLabel} to claim space and control center squares.`;
    }
    
    return `Offline Coach: Reposition your ${pieceName} from ${fromLabel} to ${toLabel} to improve board layout.`;
  };

  const askGeminiForHint = async () => {
    setLoadingAI(true);
    setAiResponse('AI is thinking...');

    const localHint = getLocalChessHint();

    if (!geminiKey) {
      // Simulate slight think delay
      setTimeout(() => {
        if (isMounted.current) {
          setAiResponse(localHint);
          setLoadingAI(false);
        }
      }, 700);
      return;
    }

    // Convert board array to readable text format
    const rowsString = board.map((row, rIdx) => {
      return `Row ${rIdx}: ` + row.map((p) => {
        if (!p) return '.';
        return `${p.color === 'w' ? 'White' : 'Black'} ${p.type.toUpperCase()}`;
      }).join(', ');
    }).join('\n');

    const prompt = `You are a Chess Grandmaster and coach. Give a short, tactical, helpful 2-sentence advice for the player currently on move.
Active player: ${getPName(turn)} (${turn === 'w' ? 'White' : 'Black'}).
Current Board (Row 0 is top black row, Row 7 is bottom white row):
${rowsString}

Give specific hints based on active piece positions. Keep the response under 35 words. Format clearly and tactfully.`;

    try {
      const text = await requestAI(prompt);
      setAiResponse(text);
    } catch (err) {
      console.error(err);
      setAiResponse(`AI Engine offline (using Local AI Coach fallback).\n${localHint}`);
    } finally {
      setLoadingAI(false);
    }
  };

  const resetGame = () => {
    setBoard(getInitialBoard());
    setSelectedPiece(null);
    setValidMoves([]);
    setTurn('w');
    setStatus(`${getPName('w')}'s turn`);
    setLastMove(null);
    setAnimatedPiece(null);
    setCaptured({ w: [], b: [] });
    setGamePaused(false);
    setAiResponse('');
  };

  const renderTray = (color) => {
    const list = captured[color] || [];
    return (
      <div className="captured-pieces-list">
        {list.length === 0 ? (
          <span className="captured-empty">No captures</span>
        ) : (
          list.map((p, i) => (
            <div key={i} className="captured-piece-pill">
              <span className={`chess-piece ${p.color === 'w' ? 'white-piece' : 'black-piece'}`} style={{ width: '16px', height: '16px' }}>
                <ChessIcon type={p.type} />
              </span>
            </div>
          ))
        )}
      </div>
    );
  };

  const boardContent = (
    <div className="chessboard">
      {board.map((row, rIdx) =>
        row.map((piece, cIdx) => {
          const isLight = (rIdx + cIdx) % 2 === 0;
          const isSelected = selectedPiece && selectedPiece.r === rIdx && selectedPiece.c === cIdx;
          const isValid = validMoves.some((m) => m.r === rIdx && m.c === cIdx);
          const hasPiece = piece !== null;

          // Trail highlights
          let trailClass = '';
          if (lastMove) {
            if (lastMove.from.r === rIdx && lastMove.from.c === cIdx) {
              trailClass = ' last-move-source';
            } else if (lastMove.to.r === rIdx && lastMove.to.c === cIdx) {
              trailClass = ' last-move-dest';
            }
          }

          const isAnimated = animatedPiece && animatedPiece.r === rIdx && animatedPiece.c === cIdx;

          return (
            <div
              key={`${rIdx}-${cIdx}`}
              className={`chess-square ${isLight ? 'light' : 'dark'} ${isSelected ? 'selected' : ''} ${isValid ? 'valid-move' : ''} ${isValid && hasPiece ? 'has-piece' : ''}${trailClass}`}
              onClick={() => handleSquareClick(rIdx, cIdx)}
            >
              {piece && (
                <span className={`chess-piece ${piece.color === 'w' ? 'white-piece' : 'black-piece'} ${isAnimated ? 'chess-piece-bounce' : ''}`} style={{ display: 'inline-block' }}>
                  <ChessIcon type={piece.type} />
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  const framedBoard = <div className="chessboard-frame">{boardContent}</div>;

  return (
    <div className="chess-container">
      {gameState === 'WELCOME' && (
        <div className="ludo-welcome-screen glass-panel animate-fadeUp">
          <div className="ludo-welcome-title">CHESS GLASS 👑</div>
          <p className="ludo-welcome-sub">
            A premium cybernetic checkered battlefield. Plan, capture, win.
          </p>

          <div className="welcome-modes">
            <button className="welcome-mode-card" onClick={startVsComputerWizard}>
              <span className="welcome-mode-icon">🤖</span>
              <span className="welcome-mode-name">VS COMPUTER</span>
              <span className="welcome-mode-desc">Challenge the AI Chess engine</span>
            </button>
            <button className="welcome-mode-card" onClick={() => setGameState('SETUP_DETAILS')}>
              <span className="welcome-mode-icon">👥</span>
              <span className="welcome-mode-name">LOCAL PLAY</span>
              <span className="welcome-mode-desc">2 players pass &amp; play</span>
            </button>
          </div>
        </div>
      )}

      {gameState === 'SETUP_DETAILS' && (
        <div className="ludo-setup-screen glass-panel animate-fadeUp">
          <h2 className="setup-title">Player Details</h2>
          <p className="setup-sub">Enter names for the competitors</p>

          <div className="setup-body" style={{ marginTop: '20px' }}>
            <div className="setup-row">
              <span className="setup-row-label">Player White ♔</span>
              <input
                type="text"
                value={playerNames.w}
                placeholder="Player 1"
                maxLength={14}
                onChange={(e) => setPlayerNames({ ...playerNames, w: e.target.value })}
                className="setup-input"
              />
            </div>

            {playerTypes.b === 'human' && (
              <div className="setup-row">
                <span className="setup-row-label">Player Black ♚</span>
                <input
                  type="text"
                  value={playerNames.b}
                  placeholder="Player 2"
                  maxLength={14}
                  onChange={(e) => setPlayerNames({ ...playerNames, b: e.target.value })}
                  className="setup-input"
                />
              </div>
            )}

            {playerTypes.b === 'bot' && (
              <div className="setup-row">
                <span className="setup-row-label">AI Level</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 'bold', color: 'var(--violet)' }}>Heuristic Engine</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
            <button className="chess-btn" onClick={() => {
              setPlayerNames({ w: '', b: '' });
              setPlayerTypes({ w: 'human', b: 'human' });
              setGameState('WELCOME');
            }}>
              Back
            </button>
            <button className="menu-btn" onClick={startChessMatch}>
              Start Match ⚔
            </button>
          </div>
        </div>
      )}

      {gameState === 'GAMEPLAY' && (
        <div style={{ width: '100%' }}>
          {/* Status HUD Bar */}
          <div className="ludo-status-panel glass-panel animate-fadeUp">
            <div className="ludo-status-text">
              <span
                className="turn-dot"
                style={{
                  background:
                    turn === 'over'
                      ? 'var(--amber)'
                      : turn === 'w'
                        ? '#f8fafc'
                        : '#0f172a',
                  boxShadow: turn === 'w' ? '0 0 8px rgba(255,255,255,0.8)' : '0 0 8px rgba(0,0,0,0.8)'
                }}
              />
              {status}
            </div>
            {turn === 'b' && playerTypes.b === 'bot' && (
              <span className="ai-calculating-badge">AI Thinking…</span>
            )}
          </div>

          {/* Interactive Layout Area */}
          <div className="ludo-layout-wrapper animate-fadeUp">
            <div style={{ flex: '0 1 auto', display: 'flex', justifyContent: 'center' }}>
              {framedBoard}
            </div>

            {/* Premium Active Turn Sidecards */}
            <div className="ludo-players-sidebar">
              {/* White Card */}
              <div
                className={`player-card glass-panel ${turn === 'w' ? 'active-turn' : ''}`}
                style={{
                  borderColor: turn === 'w' ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                  boxShadow: turn === 'w' ? '0 8px 22px rgba(59, 130, 246, 0.3)' : 'var(--e1)'
                }}
              >
                <div className="player-card-header">
                  <span style={{ fontWeight: 600 }}>♔ {getPName('w')}</span>
                  <span className="player-color-indicator" style={{ backgroundColor: '#ffffff', border: '1px solid #1e293b' }} />
                </div>
                {renderTray('w')}
              </div>

              {/* Black Card */}
              <div
                className={`player-card glass-panel ${turn === 'b' ? 'active-turn' : ''}`}
                style={{
                  borderColor: turn === 'b' ? '#a855f7' : 'rgba(255,255,255,0.08)',
                  boxShadow: turn === 'b' ? '0 8px 22px rgba(168, 85, 247, 0.3)' : 'var(--e1)'
                }}
              >
                <div className="player-card-header">
                  <span style={{ fontWeight: 600 }}>♚ {getPName('b')} {playerTypes.b === 'bot' && '· Bot'}</span>
                  <span className="player-color-indicator" style={{ backgroundColor: '#0f172a', border: '1px solid #ffffff' }} />
                </div>
                {renderTray('b')}
              </div>

              {/* AI Coach Card */}
              <div className="player-card glass-panel" style={{ borderStyle: 'dashed', borderColor: 'rgba(99, 102, 241, 0.4)' }}>
                <div className="player-card-header" style={{ marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--cyan)' }}>
                    {geminiKey ? `🧠 ${aiProviderName}` : '🧠 Offline AI Coach'}
                  </span>
                </div>
                {aiResponse ? (
                  <div className="ai-coach-bubble animate-fadeIn" style={{ fontSize: '0.82rem', lineHeight: '1.45', color: '#cbd5e1', minHeight: '44px' }}>
                    {aiResponse}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: '10px' }}>
                    {geminiKey ? `Need help? Ask ${aiProviderName} for a tactical suggestion.` : 'Need help? Get a local tactical suggestion.'}
                  </div>
                )}
                <button
                  className="ai-coach-btn"
                  onClick={askGeminiForHint}
                  disabled={loadingAI || turn === 'over'}
                  style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
                >
                  {loadingAI ? 'Analyzing Position…' : 'Get AI Hint 💡'}
                </button>
              </div>
            </div>
          </div>

          {/* Controls Toolbar */}
          <div className="chess-controls">
            <button className="chess-btn" onClick={resetGame}>↻ Restart</button>
            <button className="chess-btn" onClick={() => setGamePaused(!gamePaused)}>
              {gamePaused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button className="chess-btn" onClick={() => setSoundMuted(!soundMuted)}>
              {soundMuted ? '🔇 Muted' : '🔊 Sound'}
            </button>
            <button className="chess-btn" onClick={() => setGameState('WELCOME')}>
              ⚙ New Setup
            </button>
            <button className="chess-btn danger" onClick={() => setGameState('WELCOME')}>
              Exit
            </button>
          </div>

          {/* Pause Modal Overlay */}
          {gamePaused && turn !== 'over' && (
            <div className="modal-overlay">
              <div className="overlay-card">
                <div className="overlay-title">Game Paused</div>
                <p className="overlay-sub">Take a deep breath — the pieces will stay in check.</p>
                <button className="menu-btn" onClick={() => setGamePaused(false)}>
                  Resume Game
                </button>
              </div>
            </div>
          )}

          {/* Victory Modal Overlay */}
          {turn === 'over' && (
            <div className="modal-overlay">
              <div className="overlay-card">
                <div className="overlay-title">👑 Victory!</div>
                <p className="overlay-sub">{status}</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button className="menu-btn" onClick={resetGame}>Play Again</button>
                  <button className="chess-btn" onClick={() => setGameState('WELCOME')}>Exit</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showStartBanner && (
        <div className="game-start-banner-overlay">
          <div className="game-start-banner">GAME START</div>
        </div>
      )}
    </div>
  );
}
