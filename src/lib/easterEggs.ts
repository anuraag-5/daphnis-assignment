import { create } from 'zustand';

interface EasterEggState {
  tiltMode: boolean;
  tiltAngle: number;
  goldenBall: boolean;
  toggleTilt: () => void;
  checkGoldenBall: (history: any[]) => void;
}

const CENTER_BIN = 6;

export const useEasterEggs = create<EasterEggState>((set, get) => ({
  tiltMode: false,
  tiltAngle: 0,
  goldenBall: false,

  toggleTilt: () => {
    const { tiltMode } = get();
    const newTilt = !tiltMode;
    const angle = newTilt ? (Math.random() > 0.5 ? 5 : -5) : 0;
    set({ tiltMode: newTilt, tiltAngle: angle });
  },

  checkGoldenBall: (history: any[]) => {
    const last3 = history.slice(0, 3);
    const allCenter = last3.length === 3 && last3.every(h => h.dropColumn === CENTER_BIN);
    set({ goldenBall: allCenter });
  },
}));
