import { NextResponse } from "next/server";
import {
  buildPegMap,
  generateCombinedSeed,
  generateCommitHex,
  simulatePath,
} from "../../../lib/fairness";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serverSeed = searchParams.get("serverSeed");
    const clientSeed = searchParams.get("clientSeed");
    const nonce = searchParams.get("nonce");
    const dropColumnParam = searchParams.get("dropColumn");

    if (!serverSeed || !clientSeed || !nonce || !dropColumnParam) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const dropColumn = parseInt(dropColumnParam, 10);
    if (isNaN(dropColumn) || dropColumn < 0 || dropColumn > 12) {
      return NextResponse.json(
        { error: "Invalid dropColumn" },
        { status: 400 },
      );
    }

    const commitHex = generateCommitHex(serverSeed, nonce);
    const combinedSeed = generateCombinedSeed(serverSeed, clientSeed, nonce);

    const { pegMapHash, pegMap, prng } = buildPegMap(combinedSeed, 12);
    const { binIndex, path } = simulatePath(pegMap, prng, dropColumn, 12);

    return NextResponse.json({
      commitHex,
      combinedSeed,
      pegMapHash,
      binIndex,
      path,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
