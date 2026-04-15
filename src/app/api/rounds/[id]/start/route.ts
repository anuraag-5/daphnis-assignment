import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { generateCombinedSeed, buildPegMap, simulatePath, getPayoutMultiplier } from '../../../../../lib/fairness';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { clientSeed, betCents, dropColumn } = body;

    if (dropColumn < 0 || dropColumn > 12) {
      return NextResponse.json({ error: 'Invalid dropColumn' }, { status: 400 });
    }

    let round = await prisma.round.findUnique({ where: { id } });
    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    if (round.status !== 'CREATED') {
      return NextResponse.json({ error: 'Round already started or revealed' }, { status: 400 });
    }

    const combinedSeed = generateCombinedSeed(round.serverSeed!, clientSeed, round.nonce);
    const { pegMap, pegMapHash, prng } = buildPegMap(combinedSeed, round.rows);
    const { binIndex, path } = simulatePath(pegMap, prng, dropColumn, round.rows);

    const payoutMultiplier = getPayoutMultiplier(binIndex);

    round = await prisma.round.update({
      where: { id },
      data: {
        status: 'STARTED',
        clientSeed,
        combinedSeed,
        pegMapHash,
        dropColumn,
        binIndex,
        payoutMultiplier,
        betCents,
        pathJson: JSON.stringify(path),
      }
    });

    return NextResponse.json({
      roundId: round.id,
      pegMapHash: round.pegMapHash,
      rows: round.rows,
      binIndex: round.binIndex,
      path: path
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
