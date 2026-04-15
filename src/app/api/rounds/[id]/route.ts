import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const round = await prisma.round.findUnique({ where: { id } });
    
    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    // Do NOT expose server seed if not revealed
    if (round.status !== 'REVEALED') {
      return NextResponse.json({
        ...round,
        serverSeed: null
      });
    }

    return NextResponse.json(round);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
