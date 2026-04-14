"use client";

import React from 'react';
import { useGameStore } from '../lib/store';
import { Coins, ChevronRight, ChevronLeft } from 'lucide-react';

export default function Controls() {
  const { 
    balance, betAmount, dropColumn, status, 
    setBetAmount, setDropColumn, commitRound 
  } = useGameStore();

  const isPlaying = status !== 'IDLE' && status !== 'DONE';

  const handleDrop = () => {
    if (isPlaying || betAmount > balance || betAmount <= 0) return;
    commitRound();
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPlaying) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleDrop();
      } else if (e.code === 'ArrowLeft') {
        setDropColumn(Math.max(0, dropColumn - 1));
      } else if (e.code === 'ArrowRight') {
        setDropColumn(Math.min(12, dropColumn + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, dropColumn, handleDrop]);

  return (
    <div className="w-full max-w-sm flex flex-col space-y-6 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-xl">
      
      {/* Balance & Mute */}
      <div className="flex justify-between items-center bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
        <span className="text-zinc-400 font-medium text-sm">Balance</span>
        <div className="flex items-center space-x-2 text-amber-400 font-bold text-xl">
          <Coins size={20} />
          <span>{balance.toFixed(2)}</span>
        </div>
      </div>

      {/* Bet Amount */}
      <div className="space-y-2">
        <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider pl-1">Bet Amount</label>
        <div className="flex bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700 focus-within:border-amber-400/50 transition-colors">
          <div className="flex items-center justify-center pl-4 text-zinc-500">
             <Coins size={16} />
          </div>
          <input 
            type="number" 
            value={betAmount || ''}
            onChange={e => setBetAmount(Number(e.target.value))}
            className="w-full bg-transparent p-3 outline-none text-white font-medium"
            disabled={isPlaying}
          />
          <div className="flex">
            <button onClick={() => setBetAmount(Math.max(1, betAmount / 2))} className="px-3 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors border-l border-zinc-700">1/2</button>
            <button onClick={() => setBetAmount(betAmount * 2)} className="px-3 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors border-l border-zinc-700">2x</button>
          </div>
        </div>
      </div>

      {/* Drop Column Selection */}
      <div className="space-y-2">
        <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider pl-1">Bias / Drop Column (0-12)</label>
        <div className="flex items-center justify-between bg-zinc-800 rounded-xl p-2 border border-zinc-700">
          <button 
            onClick={() => setDropColumn(Math.max(0, dropColumn - 1))}
            disabled={isPlaying || dropColumn === 0}
            className="p-2 hover:bg-zinc-700 rounded-lg disabled:opacity-50 transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <span className="font-bold text-white text-lg w-8 text-center">{dropColumn}</span>
          <button 
            onClick={() => setDropColumn(Math.min(12, dropColumn + 1))}
            disabled={isPlaying || dropColumn === 12}
            className="p-2 hover:bg-zinc-700 rounded-lg disabled:opacity-50 transition-colors"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Play Button */}
      <button
        onClick={handleDrop}
        disabled={isPlaying || betAmount > balance || betAmount <= 0}
        className={`relative w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all
          ${isPlaying ? 'bg-zinc-700 text-zinc-500 shadow-none' : 'bg-gradient-to-r from-amber-400 to-amber-500 text-stone-900 hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] hover:scale-[1.02] active:scale-95'}
        `}
      >
        {isPlaying ? 'Dropping...' : 'Drop (SPACE)'}
      </button>

    </div>
  );
}
