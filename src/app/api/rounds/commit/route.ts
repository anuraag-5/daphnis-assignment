import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { generateCommitHex } from '../../../../lib/fairness';

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Generate serverSeed (hidden) and nonce
    const serverSeed = crypto.randomBytes(32).toString('hex');
    const nonce = '1'; // A real app might increment per user, but for MVP scope a constant or a random string is acceptable per round. Let's make it random string to be safe.
    const actualNonce = crypto.randomBytes(8).toString('hex');
    
    const commitHex = generateCommitHex(serverSeed, actualNonce);

    const round = await prisma.round.create({
      data: {
        status: 'CREATED',
        serverSeed: serverSeed,
        nonce: actualNonce,
        commitHex: commitHex,
        rows: 12,
      }
    });

    // DO NOT return serverSeed to the client yet
    return NextResponse.json({
      roundId: round.id,
      commitHex: round.commitHex,
      nonce: round.nonce
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
