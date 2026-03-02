/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Circle, RotateCcw, Trophy, User, Cpu, ExternalLink } from 'lucide-react';

type Player = 'X' | 'O' | null;

interface SquareProps {
  value: Player;
  onClick: () => void;
  isWinningSquare: boolean;
}

const Square: React.FC<SquareProps> = ({ value, onClick, isWinningSquare }) => (
  <motion.button
    whileHover={{ scale: value ? 1 : 0.98 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`relative h-24 w-24 sm:h-32 sm:w-32 rounded-2xl flex items-center justify-center text-4xl transition-colors duration-200 shadow-sm
      ${!value ? 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800' : 'bg-zinc-900 border border-zinc-800'}
      ${isWinningSquare ? 'ring-4 ring-emerald-400/50 border-emerald-400/30' : ''}`}
  >
    <AnimatePresence mode="wait">
      {value === 'X' && (
        <motion.div
          key="X"
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0 }}
          className="text-emerald-400"
        >
          <X size={48} strokeWidth={2.5} />
        </motion.div>
      )}
      {value === 'O' && (
        <motion.div
          key="O"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="text-zinc-400"
        >
          <Circle size={44} strokeWidth={2.5} />
        </motion.div>
      )}
    </AnimatePresence>
  </motion.button>
);

export default function App() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<Player | 'Draw'>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [scores, setScores] = useState({ X: 0, O: 0, Draws: 0 });
  const [isAiMode, setIsAiMode] = useState(true);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Hard');
  const [showSplash, setShowSplash] = useState(true);
  const [matchWinner, setMatchWinner] = useState<Player>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (scores.X >= 3) setMatchWinner('X');
    if (scores.O >= 3) setMatchWinner('O');
  }, [scores]);

  const calculateWinner = (squares: Player[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    if (squares.every(square => square !== null)) {
      return { winner: 'Draw' as const, line: null };
    }
    return null;
  };

  // Minimax Algorithm for AI
  const minimax = (squares: Player[], depth: number, isMaximizing: boolean): number => {
    const result = calculateWinner(squares);
    if (result?.winner === 'O') return 10 - depth;
    if (result?.winner === 'X') return depth - 10;
    if (result?.winner === 'Draw') return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = 'O';
          const score = minimax(squares, depth + 1, false);
          squares[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = 'X';
          const score = minimax(squares, depth + 1, true);
          squares[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const getBestMove = (squares: Player[]): number => {
    let bestScore = -Infinity;
    let move = -1;
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        squares[i] = 'O';
        const score = minimax(squares, 0, false);
        squares[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  };

  const getRandomMove = (squares: Player[]): number => {
    const availableMoves = squares.map((s, i) => s === null ? i : null).filter(i => i !== null) as number[];
    if (availableMoves.length === 0) return -1;
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  };

  const getMediumMove = (squares: Player[]): number => {
    // 1. Check if AI can win
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        squares[i] = 'O';
        if (calculateWinner(squares)?.winner === 'O') {
          squares[i] = null;
          return i;
        }
        squares[i] = null;
      }
    }
    // 2. Check if AI needs to block
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        squares[i] = 'X';
        if (calculateWinner(squares)?.winner === 'X') {
          squares[i] = null;
          return i;
        }
        squares[i] = null;
      }
    }
    // 3. Otherwise random
    return getRandomMove(squares);
  };

  useEffect(() => {
    if (isAiMode && !isXNext && !winner) {
      const timer = setTimeout(() => {
        const currentBoard = [...board];
        let move = -1;

        if (difficulty === 'Easy') {
          move = getRandomMove(currentBoard);
        } else if (difficulty === 'Medium') {
          move = getMediumMove(currentBoard);
        } else {
          move = getBestMove(currentBoard);
        }

        if (move !== -1) {
          handleClick(move);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isXNext, isAiMode, winner, board, difficulty]);

  const handleClick = (i: number) => {
    if (winner || board[i]) return;

    const newBoard = [...board];
    newBoard[i] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);

    const result = calculateWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      if (result.winner === 'X') {
        setScores(s => ({ ...s, X: s.X + 1 }));
      } else if (result.winner === 'O') {
        setScores(s => ({ ...s, O: s.O + 1 }));
      } else if (result.winner === 'Draw') {
        setScores(s => ({ ...s, Draws: s.Draws + 1 }));
      }
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
  };

  const resetMatch = () => {
    resetGame();
    setScores({ X: 0, O: 0, Draws: 0 });
    setMatchWinner(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 font-sans text-zinc-100 relative">
      <motion.a
        href="https://uramosdev.up.railway.app/blog"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: showSplash ? 0 : 1, x: showSplash ? -20 : 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed top-6 left-6 z-40 flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 hover:text-emerald-400 hover:border-emerald-400/30 transition-all text-xs font-bold uppercase tracking-wider"
      >
        <ExternalLink size={14} />
        Return
      </motion.a>

      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center"
            >
              <div className="flex justify-center gap-3 mb-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="text-emerald-400"
                >
                  <X size={64} strokeWidth={2.5} />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="text-zinc-400"
                >
                  <Circle size={64} strokeWidth={2.5} />
                </motion.div>
              </div>
              <h1 className="text-5xl font-bold tracking-tighter text-white mb-2">
                TIC TAC TOE <span className="text-emerald-400">ELITE</span>
              </h1>
              <div className="h-1 w-48 bg-zinc-800 mx-auto rounded-full overflow-hidden">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="h-full w-full bg-emerald-400"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showSplash ? 0 : 1, y: showSplash ? 20 : 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center justify-center gap-3">
            Tic Tac Toe <span className="text-emerald-400 font-mono text-xl bg-emerald-400/10 px-2 py-1 rounded-lg">ELITE</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Master the Grid</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-zinc-900 p-1 rounded-xl mb-4 border border-zinc-800">
          <button
            onClick={() => { setIsAiMode(true); resetGame(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${isAiMode ? 'bg-emerald-400 shadow-sm text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Cpu size={16} />
            VS AI
          </button>
          <button
            onClick={() => { setIsAiMode(false); resetGame(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${!isAiMode ? 'bg-emerald-400 shadow-sm text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <User size={16} />
            PVP
          </button>
        </div>

        {/* Difficulty Selector (Only in AI Mode) */}
        <AnimatePresence>
          {isAiMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => { setDifficulty(level); resetGame(); }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${difficulty === level ? 'bg-zinc-800 text-emerald-400 border border-emerald-400/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score Board */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-sm text-center relative overflow-hidden">
            <div className="flex items-center justify-center gap-2 text-emerald-400 mb-1">
              <User size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Player X</span>
            </div>
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              {scores.X}
              <span className="text-xs text-zinc-500 font-normal">/3</span>
              <Trophy size={14} className={scores.X >= 1 ? "text-emerald-400" : "text-zinc-800"} />
            </div>
          </div>
          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-sm text-center">
            <div className="flex items-center justify-center gap-2 text-zinc-500 mb-1">
              <RotateCcw size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Draws</span>
            </div>
            <div className="text-2xl font-bold">{scores.Draws}</div>
          </div>
          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-sm text-center relative overflow-hidden">
            <div className="flex items-center justify-center gap-2 text-zinc-400 mb-1">
              {isAiMode ? <Cpu size={16} /> : <Circle size={16} />}
              <span className="text-xs font-bold uppercase tracking-wider">{isAiMode ? 'AI (O)' : 'Player O'}</span>
            </div>
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              {scores.O}
              <span className="text-xs text-zinc-500 font-normal">/3</span>
              <Trophy size={14} className={scores.O >= 1 ? "text-zinc-400" : "text-zinc-800"} />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mb-6 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full animate-pulse ${isXNext ? 'bg-emerald-400' : 'bg-zinc-400'}`} />
            <span className="font-semibold text-zinc-300">
              {winner ? (
                winner === 'Draw' ? "It's a Draw!" : `Winner: ${winner}`
              ) : (
                `Next: ${isXNext ? 'X' : 'O'}`
              )}
            </span>
          </div>
          <button
            onClick={resetGame}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 transition-colors text-sm font-medium"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        {/* Game Board */}
        <div className="relative bg-zinc-950 p-3 rounded-3xl shadow-inner mb-8 border border-zinc-800">
          <div className="grid grid-cols-3 gap-3">
            {board.map((square, i) => (
              <Square
                key={i}
                value={square}
                onClick={() => handleClick(i)}
                isWinningSquare={winningLine?.includes(i) ?? false}
              />
            ))}
          </div>

          {/* Winner Overlay */}
          <AnimatePresence>
            {winner && !matchWinner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm rounded-3xl"
              >
                <div className="bg-zinc-900 p-8 rounded-2xl shadow-2xl border border-zinc-800 text-center">
                  {winner === 'Draw' ? (
                    <div className="text-zinc-500 mb-4">
                      <RotateCcw size={48} className="mx-auto" />
                    </div>
                  ) : (
                    <div className="flex justify-center gap-2 mb-4">
                      <motion.div
                        initial={{ scale: 0, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-emerald-400"
                      >
                        <Trophy size={48} />
                      </motion.div>
                    </div>
                  )}
                  <h2 className="text-2xl font-bold mb-2 text-zinc-100">
                    {winner === 'Draw' ? "No Winner" : (isAiMode && winner === 'O' ? "AI Wins!" : `Player ${winner} Wins!`)}
                  </h2>
                  {winner !== 'Draw' && (
                    <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-6">+1 CUP EARNED</p>
                  )}
                  <button
                    onClick={resetGame}
                    className="bg-emerald-400 text-zinc-950 px-8 py-3 rounded-xl font-bold hover:bg-emerald-300 transition-all active:scale-95 flex items-center gap-2 mx-auto"
                  >
                    Next Round
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Match Winner Overlay */}
          <AnimatePresence>
            {matchWinner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md rounded-3xl"
              >
                <div className="bg-zinc-900 p-10 rounded-2xl shadow-2xl border-2 border-emerald-400/30 text-center">
                  <div className="flex justify-center gap-2 mb-6">
                    <motion.div
                      animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-emerald-400"
                    >
                      <Trophy size={64} />
                    </motion.div>
                  </div>
                  <h2 className="text-3xl font-bold mb-2 text-white">
                    MATCH COMPLETE
                  </h2>
                  <p className="text-zinc-400 mb-8 font-medium">
                    {isAiMode && matchWinner === 'O' ? "THE AI IS THE CHAMPION!" : `PLAYER ${matchWinner} IS THE CHAMPION!`}
                  </p>
                  <button
                    onClick={resetMatch}
                    className="bg-emerald-400 text-zinc-950 px-10 py-4 rounded-xl font-black hover:bg-emerald-300 transition-all active:scale-95 flex items-center gap-3 mx-auto shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                  >
                    <RotateCcw size={20} />
                    RESET MATCH
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-center text-zinc-500 text-xs font-medium uppercase tracking-widest">
            Built with Precision & Style
          </div>
        </div>
      </motion.div>
    </div>
  );
}
