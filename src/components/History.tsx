"use client";

import React from 'react';
import { useGameStore } from '../lib/store';
import Link from 'next/link';
import { ExternalLink, Copy } from 'lucide-react';

export default function History() {
  const { history, fetchHistory } = useGameStore();

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (history.length === 0) {
    return (
      <div className="w-full mt-8 p-6 bg-zinc-900 border border-zinc-800 rounded-3xl text-center text-zinc-500 text-sm py-12">
        Play your first round to see the provably-fair session log here.
      </div>
    );
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="w-full mt-8 p-6 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
      <h3 className="font-semibold text-zinc-300 mb-4 text-sm uppercase tracking-wider">Recent Rounds (Revealed)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-400">
          <thead className="bg-zinc-950 uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Drop Col</th>
              <th className="px-4 py-3">Multiplier</th>
              <th className="px-4 py-3">Server Seed</th>
              <th className="px-4 py-3">Client Seed</th>
              <th className="px-4 py-3">Nonce</th>
              <th className="px-4 py-3 rounded-tr-lg">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {history.map((round) => (
              <tr key={round.id} className="hover:bg-zinc-800/50">
                <td className="px-4 py-3 font-bold text-white">{round.dropColumn}</td>
                <td className="px-4 py-3 font-bold text-amber-400">{round.payoutMultiplier}x</td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-24 truncate" title={round.serverSeed}>{round.serverSeed}</span>
                    <button onClick={() => handleCopy(round.serverSeed)} className="text-zinc-500 hover:text-white"><Copy size={12} /></button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-24 truncate" title={round.clientSeed}>{round.clientSeed}</span>
                    <button onClick={() => handleCopy(round.clientSeed)} className="text-zinc-500 hover:text-white"><Copy size={12} /></button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <span>{round.nonce}</span>
                    <button onClick={() => handleCopy(round.nonce)} className="text-zinc-500 hover:text-white"><Copy size={12} /></button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link 
                    href={`/verify?serverSeed=${round.serverSeed}&clientSeed=${round.clientSeed}&nonce=${round.nonce}&dropColumn=${round.dropColumn}`}
                    className="flex items-center space-x-1 text-emerald-400 hover:text-emerald-300"
                  >
                    <span>Verify</span>
                    <ExternalLink size={12} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
