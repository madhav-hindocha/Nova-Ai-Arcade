import React, { useState, useEffect, useRef } from 'react';

/* ============================================================
   LUDO CLASSIC — standard rectangular 15x15 cross board for 2-4 players,
   or dynamic radial 6-arm star board for 5-6 players.
   ============================================================ */

const CELL = 40; // px per grid cell (600x600 viewBox)
const BOARD = CELL * 15;

// Color choices (saturated, board-friendly)
const COLORS_CONFIG = [
  { name: 'Red', hex: '#ef4444', glow: '0 8px 22px rgba(239, 68, 68, 0.45)' },
  { name: 'Green', hex: '#22c55e', glow: '0 8px 22px rgba(34, 197, 94, 0.45)' },
  { name: 'Yellow', hex: '#eab308', glow: '0 8px 22px rgba(234, 179, 8, 0.45)' },
  { name: 'Blue', hex: '#3b82f6', glow: '0 8px 22px rgba(59, 130, 246, 0.45)' },
  { name: 'Purple', hex: '#a855f7', glow: '0 8px 22px rgba(168, 85, 247, 0.45)' },
  { name: 'Orange', hex: '#f97316', glow: '0 8px 22px rgba(249, 115, 22, 0.45)' }
];

// The 52 cells of the main track, clockwise, as [col, row] on the 15x15 grid.
const TRACK = [
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  [7, 0], [8, 0],
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  [14, 7], [14, 8],
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
  [7, 14], [6, 14],
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  [0, 7], [0, 6]
];

const SAFE_CELLS = new Set([0, 13, 26, 39, 8, 21, 34, 47]);
const START_IDXS = new Set([0, 13, 26, 39]);

// Seat layout: 0 = top-left, 1 = top-right, 2 = bottom-right, 3 = bottom-left
const SEATS_4 = [
  {
    startIdx: 0,
    yard: [0, 0],
    home: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
    triangle: '240,240 240,360 300,300',
    finishOffset: [-13, 0]
  },
  {
    startIdx: 13,
    yard: [9, 0],
    home: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
    triangle: '240,240 360,240 300,300',
    finishOffset: [0, -13]
  },
  {
    startIdx: 26,
    yard: [9, 9],
    home: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
    triangle: '360,240 360,360 300,300',
    finishOffset: [13, 0]
  },
  {
    startIdx: 39,
    yard: [0, 9],
    home: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
    triangle: '240,360 360,360 300,300',
    finishOffset: [0, 13]
  }
];

const SEATS_6 = [
  { startIdx: 0 },
  { startIdx: 13 },
  { startIdx: 26 },
  { startIdx: 39 },
  { startIdx: 52 },
  { startIdx: 65 }
];

// Token pockets inside a yard, relative to yard's top-left px corner
const POCKETS = [[75, 75], [165, 75], [75, 165], [165, 165]];

const seatsForCount = (count) => {
  if (count <= 4) {
    if (count === 2) return [0, 2];
    if (count === 3) return [0, 1, 2];
    return [0, 1, 2, 3];
  } else {
    if (count === 5) return [0, 1, 2, 3, 4];
    return [0, 1, 2, 3, 4, 5];
  }
};

const cellCenter = ([col, row]) => ({
  x: col * CELL + CELL / 2,
  y: row * CELL + CELL / 2
});

// Dice pip layout: which of the 9 grid slots show a pip per value
const PIP_MAP = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
};

// Synth audio (Web Audio API)
const playLudoSound = (type, muted) => {
  if (muted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'roll') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'move') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'capture') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'home') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.setValueAtTime(780, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'victory') {
      osc.type = 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.3); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.45); // C6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.75);
      osc.start();
      osc.stop(now + 0.75);
    }
  } catch {
    // Web audio block safe
  }
};

const Star = ({ x, y, fill = '#64748b', scale = 1 }) => (
  <polygon
    points="0,-7 2.1,-2.1 7,-2.1 3,1 4.6,6 0,3 -4.6,6 -3,1 -7,-2.1 -2.1,-2.1"
    fill={fill}
    opacity="0.85"
    transform={`translate(${x}, ${y}) scale(${scale})`}
  />
);

export default function Ludo({ geminiKey, requestAI, aiProviderName }) {
  const [gameState, setGameState] = useState('WELCOME');
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [playerCount, setPlayerCount] = useState(4);
  const [playerTypes, setPlayerTypes] = useState(Array(6).fill('human'));
  const [playerNames, setPlayerNames] = useState(Array(6).fill(''));
  const [playerColors, setPlayerColors] = useState([0, 1, 2, 3, 4, 5]);
  const [showStartBanner, setShowStartBanner] = useState(false);

  const [players, setPlayers] = useState([]);
  const [activePlayer, setActivePlayer] = useState(0);
  const [dice, setDice] = useState(6);
  const [tokens, setTokens] = useState({});
  const [hasRolled, setHasRolled] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const [walkingToken, setWalkingToken] = useState(null); // { playerIdx, id }
  const [rankings, setRankings] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [status, setStatus] = useState("Setup Ludo match");
  const [gamePaused, setGamePaused] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const is6Player = playerCount >= 5;
  const trackLen = is6Player ? 78 : 52;
  const finishPos = is6Player ? 82 : 56;
  const homeStartPos = is6Player ? 77 : 51;
  const maxTrackPos = is6Player ? 76 : 50;
  const activeSeatsConfig = is6Player ? SEATS_6 : SEATS_4;

  const seatOf = (playerIdx) => seatsForCount(playerCount)[playerIdx];

  // Track index for a token on the main track (pos 0..maxTrackPos), else null
  const getTrackIndex = (playerIdx, pos) => {
    if (pos < 0 || pos > maxTrackPos) return null;
    return (activeSeatsConfig[seatOf(playerIdx)].startIdx + pos) % trackLen;
  };

  const isTrackIndexSafe = (trackIdx) => {
    if (trackIdx === null) return false;
    const safeSet = is6Player 
      ? new Set([0, 8, 13, 21, 26, 34, 39, 47, 52, 60, 65, 73])
      : new Set([0, 8, 13, 21, 26, 34, 39, 47]);
    return safeSet.has(trackIdx);
  };

  // Opponent "block" (2+ same-color tokens) on a track cell
  const getBlockerOnTrackIndex = (trackIdx, activePlayerIdx, currentTokens = tokens) => {
    if (trackIdx === null) return null;
    for (let pIdx = 0; pIdx < playerCount; pIdx++) {
      if (pIdx === activePlayerIdx) continue;
      const count =
        currentTokens[pIdx]?.filter(
          (t) => getTrackIndex(pIdx, t.pos) === trackIdx
        ).length || 0;
      if (count >= 2) return pIdx;
    }
    return null;
  };

  // Vector / Math helper for 6-player Hexagonal track coords
  const get6PlayerTrackCoord = (trackIdx) => {
    if (trackIdx === null) return { x: 300, y: 300 };
    const armIdx = Math.floor(trackIdx / 13);
    const cellInArm = trackIdx % 13;
    const angle = (armIdx * 60 - 90) * Math.PI / 180;
    const u_x = Math.cos(angle);
    const u_y = Math.sin(angle);
    const v_x = -Math.sin(angle);
    const v_y = Math.cos(angle);

    const S = 22;
    const R_CENTER = 52;

    if (cellInArm <= 5) {
      const r = R_CENTER + cellInArm * S;
      return {
        x: 300 + r * u_x - S * v_x,
        y: 300 + r * u_y - S * v_y
      };
    } else if (cellInArm === 6) {
      const r = R_CENTER + 5.7 * S;
      return {
        x: 300 + r * u_x,
        y: 300 + r * u_y
      };
    } else {
      const step = 12 - cellInArm;
      const r = R_CENTER + step * S;
      return {
        x: 300 + r * u_x + S * v_x,
        y: 300 + r * u_y + S * v_y
      };
    }
  };

  // Pixel coordinates for a token
  const getTokenCoords = (playerIdx, tokenId, pos) => {
    const seat = activeSeatsConfig[seatOf(playerIdx)];

    if (pos === -1) {
      if (is6Player) {
        const angle = (seatOf(playerIdx) * 60 - 120) * Math.PI / 180;
        const x_c = 300 + 225 * Math.cos(angle);
        const y_c = 300 + 225 * Math.sin(angle);
        const offsets = [[-18, -18], [18, -18], [-18, 18], [18, 18]];
        return { x: x_c + offsets[tokenId][0], y: y_c + offsets[tokenId][1] };
      } else {
        const [yc, yr] = seat.yard;
        const [px, py] = POCKETS[tokenId];
        return { x: yc * CELL + px, y: yr * CELL + py };
      }
    }

    if (pos === finishPos) {
      if (is6Player) {
        const angle = (seatOf(playerIdx) * 60 - 90) * Math.PI / 180;
        return { x: 300 + 15 * Math.cos(angle), y: 300 + 15 * Math.sin(angle) };
      } else {
        const [dx, dy] = seat.finishOffset;
        return { x: BOARD / 2 + dx, y: BOARD / 2 + dy };
      }
    }

    if (pos >= homeStartPos && pos < finishPos) {
      if (is6Player) {
        const step = pos - homeStartPos;
        const angle = (seatOf(playerIdx) * 60 - 90) * Math.PI / 180;
        const r = 52 + (step + 0.5) * 22;
        return { x: 300 + r * Math.cos(angle), y: 300 + r * Math.sin(angle) };
      } else {
        return cellCenter(seat.home[pos - 51]);
      }
    }

    if (is6Player) {
      return get6PlayerTrackCoord(getTrackIndex(playerIdx, pos));
    } else {
      return cellCenter(TRACK[getTrackIndex(playerIdx, pos)]);
    }
  };

  const handleColorSelect = (playerIdx, colorIdx) => {
    const conflictIdx = playerColors.indexOf(colorIdx);
    const newColors = [...playerColors];
    if (conflictIdx !== -1) {
      const temp = playerColors[playerIdx];
      newColors[playerIdx] = colorIdx;
      newColors[conflictIdx] = temp;
    } else {
      newColors[playerIdx] = colorIdx;
    }
    setPlayerColors(newColors);
  };

  const startVsComputerWizard = () => {
    setPlayerCount(2);
    const types = Array(6).fill('bot');
    types[0] = 'human';
    setPlayerTypes(types);
    const names = Array(6).fill('');
    names[0] = 'Player 1';
    setPlayerNames(names);
    setGameState('SETUP_DETAILS');
  };

  const startLudoMatch = () => {
    const initialPlayers = [];
    const initialTokens = {};

    for (let i = 0; i < playerCount; i++) {
      const isBot = playerTypes[i] === 'bot';
      const name = isBot ? `Bot ${i + 1}` : playerNames[i].trim() || `Player ${i + 1}`;
      const colorIdx = playerColors[i];

      initialPlayers.push({
        id: i,
        name,
        type: playerTypes[i],
        color: COLORS_CONFIG[colorIdx].name,
        hex: COLORS_CONFIG[colorIdx].hex,
        glow: COLORS_CONFIG[colorIdx].glow,
        completed: false
      });

      initialTokens[i] = [
        { id: 0, pos: -1 },
        { id: 1, pos: -1 },
        { id: 2, pos: -1 },
        { id: 3, pos: -1 }
      ];
    }

    setPlayers(initialPlayers);
    setTokens(initialTokens);
    setGameState('GAMEPLAY');
    setRankings([]);
    setIsGameOver(false);
    setGamePaused(false);
    setIsProcessingMove(false);
    setWalkingToken(null);
    setHasRolled(false);
    setShowStartBanner(true);
    setTimeout(() => {
      if (isMounted.current) setShowStartBanner(false);
    }, 1800);

    const randomStartPlayer = Math.floor(Math.random() * playerCount);
    setActivePlayer(randomStartPlayer);

    const startP = initialPlayers[randomStartPlayer];
    setStatus(`${startP.name}'s turn`);

    if (startP.type === 'bot') {
      setTimeout(() => {
        triggerBotTurn(randomStartPlayer, initialTokens, initialPlayers);
      }, 1200);
    }
  };

  const isTokenMovable = (playerIdx, token, rollVal, currentTokens = tokens) => {
    if (token.pos === -1) return rollVal === 6;
    if (token.pos === finishPos) return false;
    if (token.pos + rollVal > finishPos) return false;

    for (let s = 1; s <= rollVal; s++) {
      const stepPos = token.pos + s;
      const stepTrackIdx = getTrackIndex(playerIdx, stepPos);
      if (stepTrackIdx !== null) {
        if (getBlockerOnTrackIndex(stepTrackIdx, playerIdx, currentTokens) !== null) {
          return false;
        }
      }
    }
    return true;
  };

  const finalizeMove = (playerIdx, id, finalPos, currentDice = dice) => {
    setTokens((prevTokens) => {
      const nextTokens = { ...prevTokens };
      let capturedOpponent = false;

      // Captures on the shared track (never on safe cells)
      const trackIdx = getTrackIndex(playerIdx, finalPos);
      if (trackIdx !== null && !isTrackIndexSafe(trackIdx)) {
        for (let oppIdx = 0; oppIdx < playerCount; oppIdx++) {
          if (oppIdx === playerIdx) continue;
          nextTokens[oppIdx] = nextTokens[oppIdx].map((oppToken) => {
            if (getTrackIndex(oppIdx, oppToken.pos) === trackIdx) {
              capturedOpponent = true;
              playLudoSound('capture', soundMuted);
              return { ...oppToken, pos: -1 };
            }
            return oppToken;
          });
        }
      }

      if (finalPos === finishPos) {
        playLudoSound('home', soundMuted);
      }

      const allTokensHome = nextTokens[playerIdx].every((t) => t.pos === finishPos);
      let updatedPlayers = [...players];

      if (allTokensHome && !players[playerIdx].completed) {
        playLudoSound('victory', soundMuted);
        setRankings((prev) => [...prev, players[playerIdx].name]);
        updatedPlayers = players.map((p) =>
          p.id === playerIdx ? { ...p, completed: true } : p
        );
        setPlayers(updatedPlayers);
      }

      setIsProcessingMove(false);
      setHasRolled(false);

      const remainingPlayers = updatedPlayers.filter((p) =>
        p.id === playerIdx ? !allTokensHome : !p.completed
      );

      if (remainingPlayers.length <= 1) {
        if (remainingPlayers.length === 1) {
          setRankings((prev) =>
            prev.includes(remainingPlayers[0].name)
              ? prev
              : [...prev, remainingPlayers[0].name]
          );
        }
        setStatus('Game over!');
        setIsGameOver(true);
      } else if ((currentDice === 6 || capturedOpponent) && !allTokensHome) {
        setStatus(`${updatedPlayers[playerIdx].name} rolls again!`);
        if (updatedPlayers[playerIdx].type === 'bot') {
          setTimeout(() => {
            triggerBotTurn(playerIdx, nextTokens, updatedPlayers);
          }, 1000);
        }
      } else {
        let nextIdx = (playerIdx + 1) % playerCount;
        while (updatedPlayers[nextIdx]?.completed) {
          nextIdx = (nextIdx + 1) % playerCount;
        }
        setActivePlayer(nextIdx);
        const nextP = updatedPlayers[nextIdx];
        setStatus(`${nextP.name}'s turn`);
        if (nextP.type === 'bot') {
          setTimeout(() => {
            triggerBotTurn(nextIdx, nextTokens, updatedPlayers);
          }, 1000);
        }
      }

      return nextTokens;
    });
  };

  // Bot decision priorities: capture > release on 6 > finish > furthest
  const makeBotDecision = (playerIdx, rollVal, currentTokens = tokens) => {
    const playerTokens = currentTokens[playerIdx] || tokens[playerIdx];
    const movable = playerTokens.filter((t) =>
      isTokenMovable(playerIdx, t, rollVal, currentTokens)
    );
    if (movable.length === 0) return null;

    for (const token of movable) {
      const finalPos = token.pos === -1 ? 0 : token.pos + rollVal;
      const trackIdx = getTrackIndex(playerIdx, finalPos);
      if (trackIdx !== null && !isTrackIndexSafe(trackIdx)) {
        for (let oppIdx = 0; oppIdx < playerCount; oppIdx++) {
          if (oppIdx === playerIdx) continue;
          const oppList = currentTokens[oppIdx] || tokens[oppIdx];
          if (oppList.some((oppT) => getTrackIndex(oppIdx, oppT.pos) === trackIdx)) {
            return token;
          }
        }
      }
    }

    const baseToken = movable.find((t) => t.pos === -1);
    if (baseToken && rollVal === 6) return baseToken;

    const finishToken = movable.find((t) => t.pos + rollVal === finishPos);
    if (finishToken) return finishToken;

    let bestToken = movable[0];
    for (const t of movable) {
      if (t.pos > bestToken.pos) bestToken = t;
    }
    return bestToken;
  };

  const getLocalLudoHint = () => {
    const activeP = players[activePlayer];
    if (!activeP) return "Enjoy playing Ludo Classic!";
    
    if (!hasRolled) {
      return `Offline Coach: Click the "Roll" button first to roll the dice and view your active tactical options!`;
    }

    const movable = tokens[activePlayer]?.filter((t) =>
      isTokenMovable(activePlayer, t, dice)
    ) || [];

    if (movable.length === 0) {
      if (hasRolled) {
        return `Offline Coach: You rolled a ${dice} but have no valid moves. Your turn passes automatically!`;
      }
      return `Offline Coach: Roll the dice to see your options! Target rolling a 6 to release tokens from your yard.`;
    }

    for (const token of movable) {
      const finalPos = token.pos === -1 ? 0 : token.pos + dice;
      const trackIdx = getTrackIndex(activePlayer, finalPos);
      if (trackIdx !== null && !isTrackIndexSafe(trackIdx)) {
        for (let oppIdx = 0; oppIdx < playerCount; oppIdx++) {
          if (oppIdx === activePlayer) continue;
          const oppList = tokens[oppIdx];
          if (oppList?.some((oppT) => getTrackIndex(oppIdx, oppT.pos) === trackIdx)) {
            return `Offline Coach: You rolled ${dice}! Move Token ${token.id + 1} to track cell ${finalPos} to CAPTURE opponent's piece!`;
          }
        }
      }
    }

    const baseToken = movable.find((t) => t.pos === -1);
    if (baseToken && dice === 6) {
      return `Offline Coach: You rolled a 6! Release Token ${baseToken.id + 1} from your yard to enter the main track.`;
    }

    const finishToken = movable.find((t) => t.pos + dice === finishPos);
    if (finishToken) {
      return `Offline Coach: Move Token ${finishToken.id + 1} straight home to score a point!`;
    }

    let best = movable[0];
    for (const t of movable) {
      if (t.pos > best.pos) best = t;
    }
    const currentText = best.pos === -1 ? 'in your yard' : `at cell ${best.pos}`;
    return `Offline Coach: Advance Token ${best.id + 1} (currently ${currentText}) by ${dice} cells to claim ground.`;
  };

  const askGeminiForHint = async () => {
    setLoadingAI(true);
    setAiResponse('AI is thinking...');

    const localHint = getLocalLudoHint();

    if (!geminiKey) {
      setTimeout(() => {
        if (isMounted.current) {
          setAiResponse(localHint);
          setLoadingAI(false);
        }
      }, 700);
      return;
    }

    const list = players.map((p) => {
      const tokenPositions = tokens[p.id]?.map((t) => {
        if (t.pos === -1) return 'In Yard';
        if (t.pos === finishPos) return 'Finished Home';
        return `Track Cell ${t.pos}`;
      }).join(', ');
      return `${p.name} (${p.color}): ${tokenPositions}`;
    }).join('\n');

    const prompt = `You are a Ludo board game coach. Give a short, helpful, tactical 2-sentence strategy tip for the player currently on move.
Active player: ${players[activePlayer]?.name} (Color: ${players[activePlayer]?.color}).
Current dice rolled: ${dice}. Has rolled: ${hasRolled ? 'Yes' : 'No'}.
All Player Positions:
${list}

Tell the player which token they should focus on or what risk to watch out for. Keep the response under 30 words total. Format clearly and tactfully.`;

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

  const walkToken = (playerIdx, tokenId, startPos, targetPos, rollVal) => {
    setIsProcessingMove(true);
    setWalkingToken({ playerIdx, id: tokenId });
    setHasRolled(false);

    if (startPos === -1) {
      playLudoSound('move', soundMuted);
      setTokens((prev) => {
        const next = { ...prev };
        next[playerIdx] = next[playerIdx].map((t) =>
          t.id === tokenId ? { ...t, pos: 0 } : t
        );
        return next;
      });
      setWalkingToken(null);
      finalizeMove(playerIdx, tokenId, 0, rollVal);
      return;
    }

    let currentPos = startPos;
    const interval = setInterval(() => {
      if (!isMounted.current) {
        clearInterval(interval);
        return;
      }
      currentPos++;
      playLudoSound('move', soundMuted);
      setTokens((prev) => {
        const next = { ...prev };
        next[playerIdx] = next[playerIdx].map((t) =>
          t.id === tokenId ? { ...t, pos: currentPos } : t
        );
        return next;
      });
      if (currentPos >= targetPos) {
        clearInterval(interval);
        setWalkingToken(null);
        finalizeMove(playerIdx, tokenId, targetPos, rollVal);
      }
    }, 170);
  };

  const triggerBotTurn = (botPlayerIdx, currentTokens = tokens, currentPlayers = players) => {
    if (gamePaused || isGameOver || gameState !== 'GAMEPLAY') return;

    setIsRolling(true);
    playLudoSound('roll', soundMuted);
    setStatus(`${currentPlayers[botPlayerIdx].name} is rolling…`);

    setTimeout(() => {
      if (!isMounted.current) return;
      const rollVal = Math.floor(Math.random() * 6) + 1;
      setDice(rollVal);
      setHasRolled(true);
      setIsRolling(false);

      const movable = currentTokens[botPlayerIdx].filter((t) =>
        isTokenMovable(botPlayerIdx, t, rollVal, currentTokens)
      );

      if (movable.length === 0) {
        setStatus(`${currentPlayers[botPlayerIdx].name} rolled ${rollVal} — no moves`);
        setTimeout(() => {
          if (!isMounted.current) return;
          let nextIdx = (botPlayerIdx + 1) % playerCount;
          while (currentPlayers[nextIdx]?.completed) {
            nextIdx = (nextIdx + 1) % playerCount;
          }
          setActivePlayer(nextIdx);
          setHasRolled(false);
          const nextP = currentPlayers[nextIdx];
          setStatus(`${nextP.name}'s turn`);
          if (nextP.type === 'bot') {
            triggerBotTurn(nextIdx, currentTokens, currentPlayers);
          }
        }, 1400);
      } else {
        const bestToken = makeBotDecision(botPlayerIdx, rollVal, currentTokens);
        setStatus(`${currentPlayers[botPlayerIdx].name} rolled ${rollVal}`);
        setTimeout(() => {
          if (!isMounted.current) return;
          const targetPos = bestToken.pos === -1 ? 0 : bestToken.pos + rollVal;
          walkToken(botPlayerIdx, bestToken.id, bestToken.pos, targetPos, rollVal);
        }, 1000);
      }
    }, 900);
  };

  const handleTokenClick = (playerIdx, id) => {
    if (!hasRolled || isRolling || isProcessingMove || playerIdx !== activePlayer || gamePaused) return;
    const token = tokens[playerIdx][id];
    if (!isTokenMovable(playerIdx, token, dice)) return;
    const targetPos = token.pos === -1 ? 0 : token.pos + dice;
    walkToken(playerIdx, id, token.pos, targetPos, dice);
  };

  const rollDice = () => {
    if (hasRolled || isRolling || isProcessingMove || gamePaused || isGameOver) return;
    if (players[activePlayer]?.type === 'bot') return;

    setIsRolling(true);
    playLudoSound('roll', soundMuted);
    setStatus('Rolling…');

    setTimeout(() => {
      if (!isMounted.current) return;
      const rollVal = Math.floor(Math.random() * 6) + 1;
      setDice(rollVal);
      setHasRolled(true);
      setIsRolling(false);

      const movableTokens = tokens[activePlayer].filter((t) =>
        isTokenMovable(activePlayer, t, rollVal)
      );

      if (movableTokens.length === 0) {
        setStatus(`${players[activePlayer].name} rolled ${rollVal} — no moves`);
        setTimeout(() => {
          if (!isMounted.current) return;
          let nextIdx = (activePlayer + 1) % playerCount;
          while (players[nextIdx]?.completed) {
            nextIdx = (nextIdx + 1) % playerCount;
          }
          setActivePlayer(nextIdx);
          setHasRolled(false);
          const nextP = players[nextIdx];
          setStatus(`${nextP.name}'s turn`);
          if (nextP.type === 'bot') {
            triggerBotTurn(nextIdx);
          }
        }, 1400);
      } else if (movableTokens.length === 1) {
        const onlyToken = movableTokens[0];
        setStatus(`${players[activePlayer].name} rolled ${rollVal} — auto moving…`);
        setTimeout(() => {
          if (!isMounted.current) return;
          const targetPos = onlyToken.pos === -1 ? 0 : onlyToken.pos + rollVal;
          walkToken(activePlayer, onlyToken.id, onlyToken.pos, targetPos, rollVal);
        }, 600);
      } else {
        setStatus(`${players[activePlayer].name} rolled ${rollVal} — pick a token`);
      }
    }, 800);
  };

  const restartGame = () => {
    const resetTokens = {};
    for (let i = 0; i < playerCount; i++) {
      resetTokens[i] = [
        { id: 0, pos: -1 },
        { id: 1, pos: -1 },
        { id: 2, pos: -1 },
        { id: 3, pos: -1 }
      ];
    }
    const resetPlayers = players.map((p) => ({ ...p, completed: false }));

    setTokens(resetTokens);
    setPlayers(resetPlayers);
    setRankings([]);
    setIsGameOver(false);
    setGamePaused(false);
    setIsProcessingMove(false);
    setWalkingToken(null);
    setHasRolled(false);
    setAiResponse('');

    const randomStartPlayer = Math.floor(Math.random() * playerCount);
    setActivePlayer(randomStartPlayer);
    setStatus(`${resetPlayers[randomStartPlayer]?.name || 'Player 1'}'s turn`);

    if (resetPlayers[randomStartPlayer]?.type === 'bot') {
      setTimeout(() => {
        triggerBotTurn(randomStartPlayer, resetTokens, resetPlayers);
      }, 1200);
    }
  };

  const getCellTokens = (coords) => {
    const list = [];
    for (let pIdx = 0; pIdx < playerCount; pIdx++) {
      tokens[pIdx]?.forEach((t) => {
        const c = getTokenCoords(pIdx, t.id, t.pos);
        if (c.x === coords.x && c.y === coords.y) {
          list.push({ playerIdx: pIdx, id: t.id });
        }
      });
    }
    return list;
  };

  const continueFromTypes = () => {
    const countHumans = playerTypes.slice(0, playerCount).filter((t) => t === 'human').length;
    if (countHumans < 1) {
      setStatus('At least one player must be human');
      return;
    }
    setGameState('SETUP_DETAILS');
  };

  const Stepper = ({ step }) => (
    <div className="setup-stepper">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`setup-step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}
        />
      ))}
    </div>
  );

  const activeSeats = seatsForCount(playerCount);
  const playerBySeat = (seatIdx) => {
    const pIdx = activeSeats.indexOf(seatIdx);
    return pIdx === -1 ? null : players[pIdx];
  };

  /* 6-Player hex board layout */
  const render6PlayerCells = () => (
    <>
      {/* Board base circle */}
      <circle cx="300" cy="300" r="292" fill="url(#board-glass)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      <circle cx="300" cy="300" r="286" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

      {/* Center finish area slices */}
      {activeSeats.map((seatIdx) => {
        const p = playerBySeat(seatIdx);
        const a1 = (seatIdx * 60 - 120) * Math.PI / 180;
        const a2 = (seatIdx * 60 - 60) * Math.PI / 180;
        const R = 52;
        const x1 = 300 + R * Math.cos(a1);
        const y1 = 300 + R * Math.sin(a1);
        const x2 = 300 + R * Math.cos(a2);
        const y2 = 300 + R * Math.sin(a2);
        
        return (
          <polygon
            key={`finish-${seatIdx}`}
            points={`300,300 ${x1},${y1} ${x2},${y2}`}
            fill={p ? `url(#grad-light-${p.color})` : 'rgba(255, 255, 255, 0.01)'}
            stroke={p ? p.hex : 'rgba(255,255,255,0.05)'}
            strokeWidth="1.5"
          />
        );
      })}

      {/* Radial Track Cells */}
      {Array.from({ length: 78 }).map((_, trackIdx) => {
        const coords = get6PlayerTrackCoord(trackIdx);
        const isSafe = isTrackIndexSafe(trackIdx);
        const armIdx = Math.floor(trackIdx / 13);
        const seatIdx = armIdx;
        const p = playerBySeat(seatIdx);
        
        let stroke = 'rgba(255,255,255,0.08)';
        let fill = 'rgba(255,255,255,0.02)';
        if (trackIdx % 13 === 0) {
          stroke = COLORS_CONFIG[seatIdx].hex;
          fill = p ? `${p.hex}15` : fill;
        } else if (isSafe) {
          stroke = 'rgba(52, 211, 153, 0.45)';
        }

        return (
          <g key={`track-cell-${trackIdx}`}>
            <circle
              cx={coords.x} cy={coords.y} r="10"
              fill={fill} stroke={stroke} strokeWidth="1.2"
            />
            {isSafe && (
              <circle
                cx={coords.x} cy={coords.y} r="6"
                fill="rgba(52, 211, 153, 0.15)"
              />
            )}
          </g>
        );
      })}

      {/* Home Column cells */}
      {activeSeats.map((seatIdx) => {
        const p = playerBySeat(seatIdx);
        const angle = (seatIdx * 60 - 90) * Math.PI / 180;

        return Array.from({ length: 5 }).map((_, step) => {
          const r = 52 + (step + 0.5) * 22;
          const x = 300 + r * Math.cos(angle);
          const y = 300 + r * Math.sin(angle);
          return (
            <circle
              key={`home-col-${seatIdx}-${step}`}
              cx={x} cy={y} r="10"
              fill={p ? `url(#grad-light-${p.color})` : 'rgba(255,255,255,0.02)'}
              stroke={p ? p.hex : 'rgba(255,255,255,0.08)'}
              strokeWidth="1.2"
            />
          );
        });
      })}

      {/* Yards */}
      {Array.from({ length: 6 }).map((_, seatIdx) => {
        const p = playerBySeat(seatIdx);
        const angle = (seatIdx * 60 - 120) * Math.PI / 180;
        const x_c = 300 + 225 * Math.cos(angle);
        const y_c = 300 + 225 * Math.sin(angle);

        return (
          <g key={`yard-6p-${seatIdx}`}>
            <circle
              cx={x_c} cy={y_c} r="46"
              fill={p ? `url(#grad-light-${p.color})` : 'rgba(255,255,255,0.01)'}
              stroke={p ? p.hex : 'rgba(255,255,255,0.06)'}
              strokeWidth="2.5"
            />
            <circle
              cx={x_c} cy={y_c} r="35"
              fill="none" stroke={p ? `${p.hex}22` : 'rgba(255,255,255,0.01)'}
              strokeWidth="1.2" strokeDasharray="4 4"
            />
            {Array.from({ length: 4 }).map((_, tokenId) => {
              const offsets = [[-18, -18], [18, -18], [-18, 18], [18, 18]];
              const px = x_c + offsets[tokenId][0];
              const py = y_c + offsets[tokenId][1];
              return (
                <g key={`pocket-6p-${seatIdx}-${tokenId}`}>
                  <circle
                    cx={px} cy={py} r="10"
                    fill="rgba(15, 23, 42, 0.45)"
                    stroke={p ? `${p.hex}44` : 'rgba(255,255,255,0.08)'}
                    strokeWidth="1.2"
                  />
                  <circle cx={px} cy={py} r="10" fill="url(#pocket-inset)" />
                </g>
              );
            })}

            {p && (
              <g>
                <rect
                  x={x_c - 40} y={y_c > 300 ? y_c + 54 : y_c - 68}
                  width="80" height="15" rx="7.5"
                  fill="rgba(15, 23, 42, 0.5)"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.8"
                />
                <text
                  x={x_c} y={y_c > 300 ? y_c + 64.5 : y_c - 57.5}
                  textAnchor="middle" fontSize="8" fontWeight="800"
                  fill="#ffffff" letterSpacing="0.8"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {p.name.toUpperCase()}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Central nexus portal */}
      <g className="nexus-spin-layer">
        <circle cx="300" cy="300" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="6 6" />
        <circle cx="300" cy="300" r="22" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        <circle cx="300" cy="300" r="22" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 8" />
      </g>
      <g className="trophy-pulse">
        <circle cx="300" cy="300" r="14" fill="rgba(251, 191, 36, 0.15)" />
        <text x="300" y="305" textAnchor="middle" fontSize="14" style={{ filter: 'drop-shadow(0 2px 5px rgba(251, 191, 36, 0.5))' }}>
          🏆
        </text>
      </g>
    </>
  );

  /* 4-Player square board layout */
  const render4PlayerCells = () => (
    <>
      {/* Frosted Glass Board Base */}
      <rect x="0" y="0" width={BOARD} height={BOARD} rx="24" fill="url(#board-glass)" />
      <rect
        x="1.5" y="1.5" width={BOARD - 3} height={BOARD - 3} rx="22.5"
        fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5"
      />
      <rect
        x="3.5" y="3.5" width={BOARD - 7} height={BOARD - 7} rx="20.5"
        fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1"
      />

      {/* Yards */}
      {SEATS_4.map((seat, seatIdx) => {
        const p = playerBySeat(seatIdx);
        const [yc, yr] = seat.yard;
        const x = yc * CELL;
        const y = yr * CELL;
        return (
          <g key={`yard-${seatIdx}`}>
            <rect
              x={x + 6} y={y + 6} width={CELL * 6 - 12} height={CELL * 6 - 12}
              fill={p ? `url(#grad-light-${p.color})` : 'rgba(255,255,255,0.02)'}
              stroke={p ? p.hex : 'rgba(255, 255, 255, 0.1)'}
              strokeWidth="2.5"
              rx="20"
            />
            <circle
              cx={x + CELL * 3} cy={y + CELL * 3} r={CELL * 2.2}
              fill="none" stroke={p ? `${p.hex}22` : 'rgba(255,255,255,0.02)'}
              strokeWidth="1.5" strokeDasharray="6 4"
            />
            {POCKETS.map(([px, py], i) => (
              <g key={i}>
                <circle
                  cx={x + px} cy={y + py} r="21"
                  fill="rgba(15, 23, 42, 0.3)"
                  stroke={p ? `${p.hex}66` : 'rgba(255,255,255,0.1)'}
                  strokeWidth="1.5"
                />
                <circle cx={x + px} cy={y + py} r="21" fill="url(#pocket-inset)" />
                <circle
                  cx={x + px} cy={y + py} r="16"
                  fill="none"
                  stroke={p ? `${p.hex}aa` : 'rgba(255,255,255,0.15)'}
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
              </g>
            ))}
            {p && (
              <g>
                <rect
                  x={x + CELL * 1.2}
                  y={y < BOARD / 2 ? y + 16 : y + CELL * 6 - 36}
                  width={CELL * 3.6} height="20" rx="10"
                  fill="rgba(15, 23, 42, 0.45)"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                />
                <text
                  x={x + CELL * 3}
                  y={y < BOARD / 2 ? y + 30 : y + CELL * 6 - 22}
                  textAnchor="middle" fontSize="10.5" fontWeight="800"
                  fill="#ffffff" letterSpacing="1"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {p.name.toUpperCase()}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Main track */}
      {TRACK.map((cell, trackIdx) => {
        const { x, y } = cellCenter(cell);
        let fill = 'rgba(255, 255, 255, 0.02)';
        let stroke = 'rgba(255, 255, 255, 0.08)';
        let strokeWidth = '1';
        let rx = '7';
        let starFill = 'rgba(255, 255, 255, 0.4)';

        if (START_IDXS.has(trackIdx)) {
          const seatIdx = SEATS_4.findIndex((s) => s.startIdx === trackIdx);
          const p = playerBySeat(seatIdx);
          fill = p ? `url(#grad-light-${p.color})` : 'rgba(255, 255, 255, 0.02)';
          stroke = p ? p.hex : 'rgba(255, 255, 255, 0.15)';
          strokeWidth = '2';
          starFill = '#ffffff';
        }

        return (
          <g key={`track-${trackIdx}`}>
            {START_IDXS.has(trackIdx) && (
              <rect
                x={x - CELL / 2 + 2} y={y - CELL / 2 + 2} width={CELL - 4} height={CELL - 4}
                rx={rx} fill="none" stroke={stroke} strokeWidth="3" opacity="0.4"
                style={{ filter: 'blur(3px)' }}
              />
            )}
            <rect
              x={x - CELL / 2 + 1.5} y={y - CELL / 2 + 1.5} width={CELL - 3} height={CELL - 3}
              rx={rx} fill={fill} stroke={stroke} strokeWidth={strokeWidth}
            />
            {SAFE_CELLS.has(trackIdx) && (
              <>
                <circle cx={x} cy={y} r="10" fill="rgba(255, 255, 255, 0.05)" />
                <Star x={x} y={y} fill={starFill} scale={1.1} />
              </>
            )}
          </g>
        );
      })}

      {/* Home columns */}
      {SEATS_4.map((seat, seatIdx) => {
        const p = playerBySeat(seatIdx);
        return (
          <g key={`home-${seatIdx}`}>
            {seat.home.map((cell, i) => {
              const { x, y } = cellCenter(cell);
              const opacity = p ? 0.25 + i * 0.15 : 0.1;
              const fill = p ? p.hex : 'rgba(255, 255, 255, 0.02)';
              const stroke = p ? `${p.hex}aa` : 'rgba(255, 255, 255, 0.08)';
              return (
                <g key={i}>
                  <rect
                    x={x - CELL / 2 + 2} y={y - CELL / 2 + 2} width={CELL - 4} height={CELL - 4}
                    rx="6" fill={fill} fillOpacity={opacity}
                    stroke={stroke} strokeWidth="1.5"
                  />
                  <line
                    x1={x - CELL / 4} y1={y} x2={x + CELL / 4} y2={y}
                    stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1"
                  />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Center finish square with 4 triangles */}
      <g>
        <rect
          x={CELL * 6} y={CELL * 6} width={CELL * 3} height={CELL * 3}
          fill="rgba(15, 23, 42, 0.4)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5"
          rx="8"
        />
        {SEATS_4.map((seat, seatIdx) => {
          const p = playerBySeat(seatIdx);
          const fill = p ? `url(#grad-light-${p.color})` : 'rgba(255, 255, 255, 0.02)';
          const stroke = p ? p.hex : 'rgba(255, 255, 255, 0.08)';
          return (
            <polygon
              key={`tri-${seatIdx}`}
              points={seat.triangle}
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
            />
          );
        })}
        
        {/* Central nexus portal */}
        <g className="nexus-spin-layer">
          <circle cx={BOARD / 2} cy={BOARD / 2} r="28" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" strokeDasharray="6 6" />
          <circle cx={BOARD / 2} cy={BOARD / 2} r="22" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
          <circle cx={BOARD / 2} cy={BOARD / 2} r="22" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 8" />
        </g>

        {/* Pulsing Trophy */}
        <g className="trophy-pulse">
          <circle cx={BOARD / 2} cy={BOARD / 2} r="15" fill="rgba(251, 191, 36, 0.15)" />
          <text
            x={BOARD / 2} y={BOARD / 2 + 5.5}
            textAnchor="middle" fontSize="16"
            style={{ filter: 'drop-shadow(0 2px 5px rgba(251, 191, 36, 0.5))' }}
          >
            🏆
          </text>
        </g>
      </g>
    </>
  );

  const renderBoard = () => (
    <svg viewBox={`0 0 ${BOARD} ${BOARD}`} className="ludo-svg-board">
      <defs>
        {/* Specular highlights for marbles */}
        <radialGradient id="token-specular" cx="30%" cy="30%" r="35%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        
        {/* Inset shadow effect for pockets */}
        <radialGradient id="pocket-inset" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0, 0, 0, 0.6)" />
          <stop offset="70%" stopColor="rgba(0, 0, 0, 0.2)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.05)" />
        </radialGradient>

        {/* Board Glass Base */}
        <linearGradient id="board-glass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.06)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.015)" />
        </linearGradient>

        {/* Color Gradients */}
        {COLORS_CONFIG.map((c) => (
          <React.Fragment key={c.name}>
            <linearGradient id={`grad-light-${c.name}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={`${c.hex}38`} />
              <stop offset="100%" stopColor={`${c.hex}05`} />
            </linearGradient>
            <linearGradient id={`token-grad-${c.name}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="45%" stopColor={c.hex} />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
          </React.Fragment>
        ))}
      </defs>

      {/* Render the background layout dynamically */}
      {is6Player ? render6PlayerCells() : render4PlayerCells()}

      {/* Render the shared tokens layer */}
      {players.map((p) =>
        tokens[p.id]?.map((token) => {
          const coords = getTokenCoords(p.id, token.id, token.pos);
          const isMovable =
            hasRolled &&
            !isRolling &&
            !isProcessingMove &&
            p.id === activePlayer &&
            p.type !== 'bot' &&
            isTokenMovable(p.id, token, dice) &&
            !gamePaused;

          const isWalking =
            walkingToken &&
            walkingToken.playerIdx === p.id &&
            walkingToken.id === token.id;

          const cellTokens = getCellTokens(coords);
          const displayCoords = { ...coords };

          // Stacked offset positions
          if (cellTokens.length > 1) {
            const idx = cellTokens.findIndex((x) => x.playerIdx === p.id && x.id === token.id);
            if (idx !== -1) {
              const theta = (idx * 2 * Math.PI) / cellTokens.length;
              const r = 8;
              displayCoords.x += r * Math.cos(theta);
              displayCoords.y += r * Math.sin(theta);
            }
          }

          return (
            <g
              key={`token-${p.id}-${token.id}`}
              onClick={() => handleTokenClick(p.id, token.id)}
              style={{ cursor: isMovable ? 'pointer' : 'default' }}
            >
              {/* Target glowing selection outline */}
              {isMovable && (
                <circle
                  cx={displayCoords.x} cy={displayCoords.y} r="18"
                  fill="none" stroke={p.hex} strokeWidth="2"
                  className="spin-ring"
                />
              )}
              {isWalking && (
                <circle
                  cx={displayCoords.x} cy={displayCoords.y} r="18"
                  fill="none" stroke="#fbbf24" strokeWidth="2"
                  className="pulse-ring"
                />
              )}

              {/* Marble drop shadow */}
              <ellipse
                cx={displayCoords.x} cy={displayCoords.y + 12} rx="12" ry="4"
                fill="rgba(0, 0, 0, 0.4)"
              />

              {/* 3D Sphere Token */}
              <g className={isWalking ? 'bounce-token' : ''}>
                <circle
                  cx={displayCoords.x} cy={displayCoords.y} r="13"
                  fill={`url(#token-grad-${p.color})`}
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                />
                <circle
                  cx={displayCoords.x} cy={displayCoords.y} r="13"
                  fill="url(#token-specular)"
                />
                
                {/* Number identifier tag */}
                <g transform={`translate(${displayCoords.x}, ${displayCoords.y})`}>
                  <circle
                    cx="0" cy="0.5" r="7.5"
                    fill="rgba(15, 23, 42, 0.5)"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="0.8"
                  />
                  <text
                    x="0" y="3.5" fontSize="9.5" fontWeight="900"
                    textAnchor="middle" fill="#ffffff" pointerEvents="none"
                    style={{ 
                      fontFamily: 'Outfit, sans-serif',
                      textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                    }}
                  >
                    {token.id + 1}
                  </text>
                </g>
              </g>
            </g>
          );
        })
      )}
    </svg>
  );

  /* ------------------ Render ------------------ */

  return (
    <div className="ludo-container">
      {gameState === 'WELCOME' && (
        <div className="ludo-welcome-screen glass-panel">
          <div className="ludo-welcome-title">LUDO CLASSIC 🎲</div>
          <p className="ludo-welcome-sub">
            The classic cross-board race — roll, escape, capture, win.
          </p>

          <div className="welcome-modes">
            <button className="welcome-mode-card" onClick={startVsComputerWizard}>
              <span className="welcome-mode-icon">🤖</span>
              <span className="welcome-mode-name">VS COMPUTER</span>
              <span className="welcome-mode-desc">You against an AI bot</span>
            </button>
            <button className="welcome-mode-card" onClick={() => setGameState('SETUP_COUNT')}>
              <span className="welcome-mode-icon">👥</span>
              <span className="welcome-mode-name">LOCAL PLAY</span>
              <span className="welcome-mode-desc">2–6 players &amp; bots</span>
            </button>
          </div>
        </div>
      )}

      {gameState === 'SETUP_COUNT' && (
        <div className="ludo-setup-screen glass-panel">
          <Stepper step={0} />
          <h2 className="setup-title">How many players?</h2>
          <p className="setup-sub">Choose the total number of participants</p>

          <div className="count-options" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                className={`count-option ${playerCount === num ? 'chosen' : ''}`}
                onClick={() => setPlayerCount(num)}
                style={{ minWidth: '70px', padding: '10px' }}
              >
                <span className="num" style={{ fontSize: '1.25rem' }}>{num}</span>
                <span className="lbl" style={{ fontSize: '0.65rem' }}>Players</span>
              </button>
            ))}
          </div>

          <button className="menu-btn" onClick={() => setGameState('SETUP_TYPES')} style={{ marginTop: '28px' }}>
            Continue
          </button>
        </div>
      )}

      {gameState === 'SETUP_TYPES' && (
        <div className="ludo-setup-screen glass-panel">
          <Stepper step={1} />
          <h2 className="setup-title">Humans or bots?</h2>
          <p className="setup-sub">Assign each seat to a human or an AI bot</p>

          <div className="setup-body">
            {Array.from({ length: playerCount }).map((_, i) => (
              <div key={i} className="setup-row">
                <span className="setup-row-label">Player {i + 1}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className={`small-btn ${playerTypes[i] === 'human' ? 'active-turn' : ''}`}
                    onClick={() => {
                      const copy = [...playerTypes];
                      copy[i] = 'human';
                      setPlayerTypes(copy);
                    }}
                  >
                    🙋 Human
                  </button>
                  <button
                    type="button"
                    className={`small-btn ${playerTypes[i] === 'bot' ? 'active-turn' : ''}`}
                    onClick={() => {
                      const copy = [...playerTypes];
                      copy[i] = 'bot';
                      setPlayerTypes(copy);
                    }}
                  >
                    🤖 Bot
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="menu-btn" onClick={continueFromTypes} style={{ marginTop: '28px' }}>
            Continue
          </button>
        </div>
      )}

      {gameState === 'SETUP_DETAILS' && (
        <div className="ludo-setup-screen glass-panel">
          <Stepper step={2} />
          <h2 className="setup-title">Player Names</h2>
          <p className="setup-sub">Enter names for human participants</p>

          <div className="setup-body">
            {Array.from({ length: playerCount }).map((_, i) => (
              <div key={i} className="setup-row">
                <span className="setup-row-label">Seat {i + 1}</span>
                {playerTypes[i] === 'human' ? (
                  <input
                    type="text"
                    value={playerNames[i]}
                    placeholder={`Player ${i + 1}`}
                    maxLength={14}
                    onChange={(e) => {
                      const copy = [...playerNames];
                      copy[i] = e.target.value;
                      setPlayerNames(copy);
                    }}
                    className="setup-input"
                  />
                ) : (
                  <input type="text" value={`Bot ${i + 1}`} className="setup-input" readOnly />
                )}
              </div>
            ))}
          </div>

          <button className="menu-btn" onClick={() => setGameState('SETUP_COLORS')} style={{ marginTop: '28px' }}>
            Continue
          </button>
        </div>
      )}

      {gameState === 'SETUP_COLORS' && (
        <div className="ludo-setup-screen glass-panel">
          <Stepper step={3} />
          <h2 className="setup-title">Pick your colors</h2>
          <p className="setup-sub">Conflicting picks swap automatically</p>

          <div className="setup-body animate-fadeUp">
            {Array.from({ length: playerCount }).map((_, playerIdx) => {
              const assignedColorIdx = playerColors[playerIdx];
              const pName =
                playerTypes[playerIdx] === 'human'
                  ? playerNames[playerIdx].trim() || `Player ${playerIdx + 1}`
                  : `Bot ${playerIdx + 1}`;

              return (
                <div key={playerIdx} className="setup-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="setup-row-label">{pName}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: COLORS_CONFIG[assignedColorIdx].hex }}>
                      {COLORS_CONFIG[assignedColorIdx].name}
                    </span>
                  </div>

                  {playerTypes[playerIdx] === 'human' ? (
                    <div className="color-swatches" style={{ marginTop: '10px' }}>
                      {COLORS_CONFIG.map((c, colIdx) => (
                        <button
                          key={colIdx}
                          type="button"
                          className={`color-swatch ${playerColors[playerIdx] === colIdx ? 'chosen' : ''}`}
                          onClick={() => handleColorSelect(playerIdx, colIdx)}
                          style={{
                            backgroundColor: c.hex,
                            boxShadow: playerColors[playerIdx] === colIdx ? c.glow : 'none'
                          }}
                          aria-label={c.name}
                        />
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '6px' }}>
                      Assigned automatically
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <button className="menu-btn" onClick={startLudoMatch} style={{ marginTop: '28px' }}>
            Start Game 🎲
          </button>
        </div>
      )}

      {gameState === 'GAMEPLAY' && (
        <div style={{ width: '100%' }}>
          <div className="ludo-status-panel glass-panel">
            <div className="ludo-status-text">
              <span
                className="turn-dot"
                style={{ background: players[activePlayer]?.hex || '#fff' }}
              />
              {status}
            </div>

            <div className="ludo-dice-roller">
              <div
                className={`dice ${isRolling ? 'rolling' : ''} ${
                  hasRolled || isRolling || isGameOver || gamePaused || players[activePlayer]?.type === 'bot'
                    ? 'disabled'
                    : ''
                }`}
                onClick={rollDice}
                role="button"
                aria-label="Roll dice"
                style={{ color: players[activePlayer]?.hex || '#ffffff' }}
              >
                {Array.from({ length: 9 }).map((_, i) => (
                  <span
                    key={i}
                    className="pip"
                    style={{ opacity: PIP_MAP[dice]?.includes(i) ? 1 : 0 }}
                  />
                ))}
              </div>

              <button
                className="small-btn"
                onClick={rollDice}
                disabled={
                  hasRolled || isRolling || isGameOver || gamePaused || players[activePlayer]?.type === 'bot'
                }
              >
                Roll 🎲
              </button>
            </div>
          </div>

          <div className="ludo-layout-wrapper">
            <div style={{ flex: '0 1 auto', display: 'flex', justifyContent: 'center' }}>
              <div className="ludo-board-frame">
                {renderBoard()}
              </div>
            </div>

            <div className="ludo-players-sidebar">
              {players.map((p) => {
                const isActive = p.id === activePlayer && !p.completed && !isGameOver;
                const yardCount = tokens[p.id]?.filter((t) => t.pos === -1).length || 0;
                const completedCount = tokens[p.id]?.filter((t) => t.pos === finishPos).length || 0;
                const activeCount = 4 - yardCount - completedCount;

                return (
                  <div
                    key={p.id}
                    className={`player-card glass-panel ${isActive ? 'active-turn' : ''}`}
                    style={{
                      borderColor: isActive ? p.hex : 'rgba(255,255,255,0.08)',
                      boxShadow: isActive ? p.glow : 'var(--e1)'
                    }}
                  >
                    <div className="player-card-header">
                      <span style={{ fontWeight: 600, color: p.completed ? 'var(--muted)' : '#fff' }}>
                        {p.name} {p.completed && '🏆'} {p.type === 'bot' && '· Bot'}
                      </span>
                      <span className="player-color-indicator" style={{ backgroundColor: p.hex }} />
                    </div>
                    <div className="player-card-stats">
                      <span>Yard <b>{yardCount}</b></span>
                      <span>Track <b>{activeCount}</b></span>
                      <span>Home <b>{completedCount}</b></span>
                    </div>
                  </div>
                );
              })}

              {rankings.length > 0 && (
                <div className="rankings-panel glass-panel">
                  <div className="rankings-title">🏆 Leaderboard</div>
                  {rankings.map((rankName, rIdx) => (
                    <div key={rIdx} className="ranking-badge">
                      <span>
                        {rIdx === 0 ? '🥇' : rIdx === 1 ? '🥈' : rIdx === 2 ? '🥉' : `${rIdx + 1}.`}{' '}
                        {rankName}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Gemini AI Coach Card */}
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
                    {geminiKey ? `Need help? Ask ${aiProviderName} for a Ludo tactical strategy tip.` : 'Need help? Get a local tactical suggestion.'}
                  </div>
                )}
                <button
                  className="ai-coach-btn"
                  onClick={askGeminiForHint}
                  disabled={loadingAI || isGameOver}
                  style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
                >
                  {loadingAI ? 'Analyzing Board…' : 'Get AI Hint 💡'}
                </button>
              </div>
            </div>
          </div>

          <div className="chess-controls">
            <button className="chess-btn" onClick={restartGame}>↻ Restart</button>
            <button className="chess-btn" onClick={() => setGamePaused(!gamePaused)}>
              {gamePaused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button className="chess-btn" onClick={() => setSoundMuted(!soundMuted)}>
              {soundMuted ? '🔇 Muted' : '🔊 Sound'}
            </button>
            <button className="chess-btn" onClick={() => setGameState('SETUP_COUNT')}>
              ⚙ New Setup
            </button>
            <button className="chess-btn danger" onClick={() => setGameState('WELCOME')}>
              Exit
            </button>
          </div>

          {gamePaused && !isGameOver && (
            <div className="modal-overlay">
              <div className="overlay-card">
                <div className="overlay-title">Game Paused</div>
                <p className="overlay-sub">Take a break — the board will wait for you.</p>
                <button className="menu-btn" onClick={() => setGamePaused(false)}>
                  Resume Game
                </button>
              </div>
            </div>
          )}

          {isGameOver && (
            <div className="modal-overlay">
              <div className="overlay-card">
                <div className="overlay-title">🏆 {rankings[0]} Wins!</div>
                <p className="overlay-sub">
                  {rankings.map((n, i) => `${i + 1}. ${n}`).join('  ·  ')}
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button className="menu-btn" onClick={restartGame}>Play Again</button>
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
