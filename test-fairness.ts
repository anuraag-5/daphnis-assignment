import { generateCommitHex, generateCombinedSeed, buildPegMap, simulatePath, Xorshift32 } from './src/lib/fairness';

const serverSeed = "b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc";
const nonce = "42";
const clientSeed = "candidate-hello";

const commitHex = generateCommitHex(serverSeed, nonce);
console.log("commitHex:", commitHex);

const combinedSeed = generateCombinedSeed(serverSeed, clientSeed, nonce);
console.log("combinedSeed:", combinedSeed);

const { pegMap, pegMapHash, prng } = buildPegMap(combinedSeed, 12);
console.log("Row 0:", pegMap[0]);
console.log("Row 1:", pegMap[1]);
console.log("Row 2:", pegMap[2]);
console.log("pegMapHash:", pegMapHash);

const dropColumn = 6;
const { binIndex } = simulatePath(pegMap, prng, dropColumn, 12);
console.log("binIndex:", binIndex);

// Let's also verify the first 5 rands
const seedBuffer = Buffer.from(combinedSeed.substring(0, 8), 'hex');
const seedInt = seedBuffer.readUInt32BE(0);
const prngTest = new Xorshift32(seedInt);
console.log("First 5 rands:");
for(let i = 0; i < 5; i++) {
  console.log(prngTest.nextFloat());
}
