import { describe, it, expect } from 'vitest';
import {
  Xorshift32,
  sha256,
  generateCommitHex,
  generateCombinedSeed,
  buildPegMap,
  simulatePath,
  getPayoutMultiplier,
  PAYOUT_MULTIPLIERS,
} from './fairness';

// ── Known test vectors ────────────────────────────────────────────────────────
const SERVER_SEED = 'b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc';
const CLIENT_SEED = 'candidate-hello';
const NONCE = '42';

describe('Xorshift32', () => {
  it('produces deterministic sequence from a fixed seed', () => {
    const prng = new Xorshift32(0xdeadbeef);
    const first = prng.next();
    const second = prng.next();
    // Same seed → same sequence
    const prng2 = new Xorshift32(0xdeadbeef);
    expect(prng2.next()).toBe(first);
    expect(prng2.next()).toBe(second);
  });

  it('never returns 0 (avoids degenerate state)', () => {
    const prng = new Xorshift32(0);
    for (let i = 0; i < 1000; i++) {
      expect(prng.next()).toBeGreaterThan(0);
    }
  });

  it('nextFloat is in [0, 1)', () => {
    const prng = new Xorshift32(12345);
    for (let i = 0; i < 500; i++) {
      const f = prng.nextFloat();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
    }
  });
});

describe('sha256 / commit helpers', () => {
  it('sha256 produces a 64-char hex string', () => {
    expect(sha256('hello')).toHaveLength(64);
    expect(sha256('hello')).toMatch(/^[0-9a-f]+$/);
  });

  it('generateCommitHex matches known vector', () => {
    const commit = generateCommitHex(SERVER_SEED, NONCE);
    expect(commit).toBe('bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34');
  });

  it('generateCombinedSeed matches known vector', () => {
    const combined = generateCombinedSeed(SERVER_SEED, CLIENT_SEED, NONCE);
    expect(combined).toBe('e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0');
  });

  it('different inputs produce different hashes', () => {
    expect(generateCommitHex(SERVER_SEED, NONCE)).not.toBe(
      generateCommitHex(SERVER_SEED, 'other-nonce')
    );
  });
});

describe('buildPegMap', () => {
  it('row 0 bias matches known vector (0.422123)', () => {
    const combined = generateCombinedSeed(SERVER_SEED, CLIENT_SEED, NONCE);
    const { pegMap } = buildPegMap(combined, 12);
    expect(pegMap[0][0]).toBe(0.422123);
  });

  it('produces correct row lengths (triangular)', () => {
    const combined = generateCombinedSeed(SERVER_SEED, CLIENT_SEED, NONCE);
    const { pegMap } = buildPegMap(combined, 12);
    for (let r = 0; r < 12; r++) {
      expect(pegMap[r]).toHaveLength(r + 1);
    }
  });

  it('all biases are in [0.4, 0.6] range (±0.1 of 0.5)', () => {
    const combined = generateCombinedSeed(SERVER_SEED, CLIENT_SEED, NONCE);
    const { pegMap } = buildPegMap(combined, 12);
    for (const row of pegMap) {
      for (const bias of row) {
        expect(bias).toBeGreaterThanOrEqual(0.4);
        expect(bias).toBeLessThanOrEqual(0.6);
      }
    }
  });

  it('pegMapHash is a stable 64-char hex', () => {
    const combined = generateCombinedSeed(SERVER_SEED, CLIENT_SEED, NONCE);
    const { pegMapHash } = buildPegMap(combined, 12);
    expect(pegMapHash).toHaveLength(64);
    // Deterministic: same input → same hash
    const { pegMapHash: pegMapHash2 } = buildPegMap(combined, 12);
    expect(pegMapHash).toBe(pegMapHash2);
  });
});

describe('simulatePath', () => {
  it('binIndex matches known vector (6) for dropColumn=6', () => {
    const combined = generateCombinedSeed(SERVER_SEED, CLIENT_SEED, NONCE);
    const { pegMap, prng } = buildPegMap(combined, 12);
    const { binIndex } = simulatePath(pegMap, prng, 6, 12);
    expect(binIndex).toBe(6);
  });

  it('path has exactly ROWS entries, each 0 or 1', () => {
    const combined = generateCombinedSeed(SERVER_SEED, CLIENT_SEED, NONCE);
    const { pegMap, prng } = buildPegMap(combined, 12);
    const { path } = simulatePath(pegMap, prng, 6, 12);
    expect(path).toHaveLength(12);
    for (const step of path) {
      expect([0, 1]).toContain(step);
    }
  });

  it('binIndex equals sum of path decisions', () => {
    const combined = generateCombinedSeed(SERVER_SEED, CLIENT_SEED, NONCE);
    const { pegMap, prng } = buildPegMap(combined, 12);
    const { binIndex, path } = simulatePath(pegMap, prng, 6, 12);
    expect(binIndex).toBe(path.reduce((a, b) => a + b, 0));
  });

  it('is fully deterministic — same seeds produce same path', () => {
    const combined = generateCombinedSeed(SERVER_SEED, CLIENT_SEED, NONCE);
    const { pegMap: pm1, prng: p1 } = buildPegMap(combined, 12);
    const { pegMap: pm2, prng: p2 } = buildPegMap(combined, 12);
    const { binIndex: b1, path: path1 } = simulatePath(pm1, p1, 6, 12);
    const { binIndex: b2, path: path2 } = simulatePath(pm2, p2, 6, 12);
    expect(b1).toBe(b2);
    expect(path1).toEqual(path2);
  });

  it('dropColumn bias shifts distribution — left column averages lower than right', () => {
    // The bias per row is small (adj = ±0.06 max), so we need enough samples
    let sumLeft = 0, sumRight = 0;
    const N = 200;
    for (let i = 1; i <= N; i++) {
      const seed = sha256(`test-seed-${i}`);
      const { pegMap: pm1, prng: p1 } = buildPegMap(seed, 12);
      const { pegMap: pm2, prng: p2 } = buildPegMap(seed, 12);
      sumLeft += simulatePath(pm1, p1, 0, 12).binIndex;
      sumRight += simulatePath(pm2, p2, 12, 12).binIndex;
    }
    // Left-biased drop should land lower on average than right-biased drop
    expect(sumLeft / N).toBeLessThan(sumRight / N);
  });
});

describe('getPayoutMultiplier', () => {
  it('returns correct multipliers for edge bins', () => {
    expect(getPayoutMultiplier(0)).toBe(10);
    expect(getPayoutMultiplier(12)).toBe(10);
    expect(getPayoutMultiplier(6)).toBe(0.2); // center is lowest
  });

  it('payout table is symmetric', () => {
    for (let i = 0; i <= 6; i++) {
      expect(PAYOUT_MULTIPLIERS[i]).toBe(PAYOUT_MULTIPLIERS[12 - i]);
    }
  });

  it('returns 0 for out-of-range indices', () => {
    expect(getPayoutMultiplier(-1)).toBe(0);
    expect(getPayoutMultiplier(13)).toBe(0);
  });
});
