import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    let round = await prisma.round.findUnique({ where: { id } });
    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    if (round.status !== 'STARTED') {
      return NextResponse.json({ error: 'Round must be in STARTED status to reveal' }, { status: 400 });
    }

    round = await prisma.round.update({
      where: { id },
      data: {
        status: 'REVEALED',
        revealedAt: new Date(),
      }
    });

    return NextResponse.json({
      serverSeed: round.serverSeed
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
