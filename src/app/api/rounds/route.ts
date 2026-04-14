import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParams = searchParams.get('limit');
    let limit = 20;
    
    if (limitParams) {
       const parsed = parseInt(limitParams, 10);
       if (!isNaN(parsed) && parsed > 0) limit = parsed;
    }

    const rounds = await prisma.round.findMany({
      where: {
        status: 'REVEALED',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        status: true,
        betCents: true,
        payoutMultiplier: true,
        commitHex: true,
        serverSeed: true,
        clientSeed: true,
        nonce: true,
        dropColumn: true
      }
    });

    return NextResponse.json(rounds);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
