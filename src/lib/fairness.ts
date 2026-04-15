import crypto from 'crypto';

export class Xorshift32 {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
    if (this.state === 0) {
      this.state = 1;
    }
  }

  next(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }

  nextFloat(): number {
    return this.next() / 4294967296.0;
  }
}

export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function generateCommitHex(serverSeed: string, nonce: string): string {
  return sha256(`${serverSeed}:${nonce}`);
}

export function generateCombinedSeed(serverSeed: string, clientSeed: string, nonce: string): string {
  return sha256(`${serverSeed}:${clientSeed}:${nonce}`);
}

export function buildPegMap(combinedSeedHex: string, rows: number = 12) {
  const seedBuffer = Buffer.from(combinedSeedHex.substring(0, 8), 'hex');
  const seedInt = seedBuffer.readUInt32BE(0);
  
  const prng = new Xorshift32(seedInt);
  const pegMap: number[][] = [];
  
  for (let r = 0; r < rows; r++) {
    const rowPegs: number[] = [];
    for (let c = 0; c <= r; c++) {
      const rawBias = 0.5 + (prng.nextFloat() - 0.5) * 0.2;
      const roundedBias = Math.round(rawBias * 1000000) / 1000000;
      rowPegs.push(roundedBias);
    }
    pegMap.push(rowPegs);
  }
  
  const pegMapHash = sha256(JSON.stringify(pegMap));
  return { pegMap, pegMapHash, prng };
}

export function simulatePath(pegMap: number[][], prng: Xorshift32, dropColumn: number, rows: number = 12) {
  let pos = 0;
  const adj = (Math.floor(rows / 2) - dropColumn) * 0.01;
  const path: number[] = []; // store 0 or 1
  
  for (let r = 0; r < rows; r++) {
    const pegIndex = Math.min(pos, r);
    const leftBias = pegMap[r][pegIndex];
    let adjBias = leftBias + adj;
    if (adjBias < 0) adjBias = 0;
    if (adjBias > 1) adjBias = 1;

    const rnd = prng.nextFloat();
    if (rnd < adjBias) {
      path.push(0);
    } else {
      path.push(1);
      pos += 1;
    }
  }
  
  return { binIndex: pos, path };
}

export const PAYOUT_MULTIPLIERS = [
  10, 5, 2, 1.5, 1, 0.5, 0.2, 0.5, 1, 1.5, 2, 5, 10
];

export function getPayoutMultiplier(binIndex: number): number {
  if (binIndex < 0 || binIndex >= PAYOUT_MULTIPLIERS.length) return 0;
  return PAYOUT_MULTIPLIERS[binIndex];
}
