"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useGameStore } from '../lib/store';
import { useEasterEggs } from '../lib/easterEggs';
import confetti from 'canvas-confetti';
import { PAYOUT_MULTIPLIERS } from '../lib/fairness';

const ROWS = 12;
const SPACING_X = 40;
const SPACING_Y = 40;
const START_Y = -40;

export default function PlinkoBoard() {
  const { status, path, binIndex, finishAnimation, history } = useGameStore();
  const { tiltMode, tiltAngle, goldenBall, toggleTilt, checkGoldenBall } = useEasterEggs();
  const ballControls = useAnimation();
  const [activeBin, setActiveBin] = useState<number | null>(null);
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const [trailDots, setTrailDots] = useState<{ x: number; y: number; id: number }[]>([]);
  const trailIdRef = useRef(0);

  const pegs = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= r; c++) {
      pegs.push({
        id: `peg-${r}-${c}`,
        x: (c - r / 2) * SPACING_X,
        y: r * SPACING_Y
      });
    }
  }

  const bins = [];
  for (let c = 0; c <= ROWS; c++) {
    bins.push({
      id: `bin-${c}`,
      index: c,
      x: (c - ROWS / 2) * SPACING_X,
      y: ROWS * SPACING_Y + 20,
      multiplier: PAYOUT_MULTIPLIERS[c]
    });
  }

  useEffect(() => {
    checkGoldenBall(history);
  }, [history]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 't' || e.key === 'T') toggleTilt();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [toggleTilt]);

  useEffect(() => {
    if (status === 'ANIMATING' && path) {
      animateBall(path);
    } else if (status === 'IDLE') {
      ballControls.set({ x: 0, y: START_Y, opacity: 0 });
      setActiveBin(null);
      setTrailDots([]);
    }
  }, [status, path]);

  const spawnTrailDot = (x: number, y: number) => {
    if (!goldenBall) return;
    const id = trailIdRef.current++;
    setTrailDots(prev => [...prev.slice(-20), { x, y, id }]);
  };

  const animateBall = async (path: number[]) => {
    setActiveBin(null);
    setTrailDots([]);
    await ballControls.set({ x: 0, y: START_Y, opacity: 1 });

    let currentPos = 0;

    await ballControls.start({
      x: 0,
      y: 0,
      transition: { duration: 0.2, ease: "easeIn" }
    });
    spawnTrailDot(250, 50);

    for (let r = 0; r < ROWS; r++) {
      const decision = path[r];
      currentPos += decision;

      const nextX = (currentPos - (r + 1) / 2) * SPACING_X;
      const nextY = (r + 1) * SPACING_Y;

      playTickSound();
      spawnTrailDot(250 + nextX, 50 + nextY);

      await ballControls.start({
        x: nextX,
        y: nextY,
        transition: {
          type: "spring",
          stiffness: 200,
          damping: 15,
          mass: 0.8
        }
      });
    }

    const finalX = (currentPos - ROWS / 2) * SPACING_X;
    const finalY = ROWS * SPACING_Y + 40;

    await ballControls.start({
      x: finalX,
      y: finalY,
      transition: { duration: 0.2, ease: "easeIn" }
    });

    setActiveBin(currentPos);

    const rect = document.getElementById(`bin-${currentPos}`)?.getBoundingClientRect();
    if (rect) {
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      confetti({
        particleCount: goldenBall ? 120 : 50,
        spread: 60,
        origin: { x, y },
        colors: goldenBall
          ? ['#FFD700', '#FFA500', '#FFEC00', '#fff']
          : ['#FFC107', '#FF9800', '#4CAF50']
      });
    }

    setTimeout(() => {
      finishAnimation();
    }, 500);
  };

  const playTickSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
    }
  };

  return (
    <div
      className="relative w-full max-w-2xl flex flex-col items-center justify-start p-2 sm:p-8 bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 overflow-hidden h-[450px] sm:h-[550px] md:h-[700px]"
      style={{
        transform: tiltMode ? `rotate(${tiltAngle}deg)` : undefined,
        transition: 'transform 0.4s ease',
      }}
    >
      {tiltMode && (
        <div
          className="pointer-events-none absolute inset-0 z-30 rounded-3xl"
          style={{
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 3px)',
            mixBlendMode: 'multiply',
          }}
        />
      )}
      {tiltMode && (
        <div
          className="pointer-events-none absolute inset-0 z-30 rounded-3xl"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.55) 100%)',
          }}
        />
      )}
      {tiltMode && (
        <span className="absolute top-3 left-1/2 -translate-x-1/2 z-40 text-xs font-mono text-amber-400 opacity-70 tracking-widest uppercase select-none">
          ★ TILT ★
        </span>
      )}

      {goldenBall && status === 'IDLE' && (
        <span className="absolute top-3 right-4 z-40 text-xs font-mono text-yellow-300 animate-pulse select-none">
          ✦ Golden Ball
        </span>
      )}

      <div className="relative transform origin-top scale-[0.6] sm:scale-75 md:scale-100" style={{ width: 500, height: 600 }}>
       
        {pegs.map(peg => (
          <div
            key={peg.id}
            className="absolute rounded-full bg-zinc-600 shadow-[0_0_8px_rgba(255,255,255,0.2)]"
            style={{
              width: 10,
              height: 10,
              left: 250 + peg.x - 5,
              top: 50 + peg.y - 5
            }}
          />
        ))}

        {goldenBall && trailDots.map(dot => (
          <motion.div
            key={dot.id}
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.6 }}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 8,
              height: 8,
              left: dot.x - 4,
              top: dot.y - 4,
              background: 'radial-gradient(circle, #FFD700, #FFA500)',
              boxShadow: '0 0 6px #FFD700',
              zIndex: 15,
            }}
          />
        ))}

        {bins.map(bin => {
          const isActive = activeBin === bin.index;
          return (
            <motion.div
              id={bin.id}
              key={bin.id}
              className={`absolute flex items-center justify-center text-xs font-bold rounded-md
                ${isActive ? 'bg-amber-400 text-black z-10' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}
              `}
              animate={{
                scale: isActive ? 1.2 : 1,
                y: isActive ? 10 : 0
              }}
              style={{
                width: 32,
                height: 32,
                left: 250 + bin.x - 16,
                top: 50 + bin.y - 16
              }}
            >
              {bin.multiplier}x
            </motion.div>
          );
        })}

        <motion.div
          animate={ballControls}
          initial={{ x: 0, y: START_Y, opacity: 0 }}
          className="absolute rounded-full z-20"
          style={{
            width: 14,
            height: 14,
            left: 250 - 7,
            top: 50 - 7,
            background: goldenBall
              ? 'radial-gradient(circle at 35% 35%, #fff7a0, #FFD700 50%, #b8860b)'
              : '#fbbf24',
            boxShadow: goldenBall
              ? '0 0 18px 4px #FFD700, 0 0 6px #fff'
              : '0 0 15px #fbbf24',
          }}
        />
      </div>
      <div className="absolute top-4 right-4 flex space-x-2">
        {history.slice(0, 5).map((h, i) => (
          <div key={i} className={`px-2 py-1 bg-zinc-800 border border-zinc-700 text-xs rounded-md ${h.payoutMultiplier >= 1 ? 'text-green-400' : 'text-zinc-400'}`}>
            {h.payoutMultiplier}x
          </div>
        ))}
      </div>
    </div>
  );
}
