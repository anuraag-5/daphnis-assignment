import { create } from 'zustand';

interface GameState {
  balance: number;
  betAmount: number;
  dropColumn: number;
  status: 'IDLE' | 'COMMITTING' | 'STARTED' | 'ANIMATING' | 'REVEALING' | 'DONE';
  currentRoundId: string | null;
  serverSeed: string | null;
  clientSeed: string;
  nonce: string | null;
  commitHex: string | null;
  path: number[] | null;
  binIndex: number | null;
  payoutMultiplier: number | null;
  history: any[];

  setBetAmount: (amount: number) => void;
  setDropColumn: (col: number) => void;
  setStatus: (status: GameState['status']) => void;
  setClientSeed: (seed: string) => void;
  
  commitRound: () => Promise<void>;
  startRound: () => Promise<void>;
  finishAnimation: () => Promise<void>;
  fetchHistory: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  balance: 1000, // Demo balance
  betAmount: 10,
  dropColumn: 6, // center
  status: 'IDLE',
  currentRoundId: null,
  serverSeed: null,
  clientSeed: 'candidate-hello',
  nonce: null,
  commitHex: null,
  path: null,
  binIndex: null,
  payoutMultiplier: null,
  history: [],

  setBetAmount: (amount) => set({ betAmount: amount }),
  setDropColumn: (col) => set({ dropColumn: col }),
  setStatus: (status) => set({ status }),
  setClientSeed: (seed) => set({ clientSeed: seed }),

  commitRound: async () => {
    const { betAmount, balance } = get();
    if (betAmount > balance) {
      alert("Insufficient balance");
      return;
    }
    
    set({ status: 'COMMITTING' });
    try {
      const res = await fetch('/api/rounds/commit', { method: 'POST' });
      const data = await res.json();
      set({
        currentRoundId: data.roundId,
        commitHex: data.commitHex,
        nonce: data.nonce,
        status: 'IDLE', // ready to start
        serverSeed: null,
        path: null,
        binIndex: null,
        payoutMultiplier: null,
      });
      // automatically start
      await get().startRound();
    } catch (err) {
      console.error(err);
      set({ status: 'IDLE' });
    }
  },

  startRound: async () => {
    const { currentRoundId, clientSeed, betAmount, dropColumn, balance } = get();
    if (!currentRoundId) return;

    set({ status: 'STARTED' });
    try {
      const res = await fetch(`/api/rounds/${currentRoundId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientSeed, betCents: betAmount * 100, dropColumn })
      });
      const data = await res.json();
      
      set({
        path: data.path,
        binIndex: data.binIndex,
        balance: balance - betAmount,
        status: 'ANIMATING',
      });
    } catch (err) {
      console.error(err);
      set({ status: 'IDLE' });
    }
  },

  finishAnimation: async () => {
    const { currentRoundId, balance, betAmount } = get();
    if (!currentRoundId) return;
    
    set({ status: 'REVEALING' });
    try {
      const res = await fetch(`/api/rounds/${currentRoundId}/reveal`, { method: 'POST' });
      const revealData = await res.json();

      // fetch full details to get multiplier
      const detailsRes = await fetch(`/api/rounds/${currentRoundId}`);
      const details = await detailsRes.json();
      
      const wonAmount = betAmount * (details.payoutMultiplier || 0);

      set((state) => ({
        status: 'DONE',
        serverSeed: revealData.serverSeed,
        payoutMultiplier: details.payoutMultiplier,
        balance: balance + wonAmount,
        history: [details, ...state.history].slice(0, 10),
      }));

      // allow next round
      setTimeout(() => {
        set({ status: 'IDLE' });
      }, 3000);
    } catch (err) {
      console.error(err);
      set({ status: 'IDLE' });
    }
  },

  fetchHistory: async () => {
    try {
      const res = await fetch('/api/rounds?limit=10');
      const data = await res.json();
      // only show revealed rounds in history
      set({ history: data.filter((r: any) => r.status === 'REVEALED') });
    } catch (e) {
      console.error(e);
    }
  }
}));
