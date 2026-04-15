"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import History from '@/components/History';

function VerifyFormContent() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    serverSeed: '',
    clientSeed: '',
    nonce: '',
    dropColumn: '6'
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sSeed = searchParams.get('serverSeed');
    const cSeed = searchParams.get('clientSeed');
    const nonceP = searchParams.get('nonce');
    const dCol = searchParams.get('dropColumn');

    if (sSeed || cSeed || nonceP) {
      setForm({
        serverSeed: sSeed || '',
        clientSeed: cSeed || '',
        nonce: nonceP || '',
        dropColumn: dCol || '6'
      });
    } else {
      const saved = sessionStorage.getItem('verifyForm');
      if (saved) {
        try { setForm(JSON.parse(saved)); } catch (e) { }
      }
    }
  }, [searchParams]);

  useEffect(() => {
    sessionStorage.setItem('verifyForm', JSON.stringify(form));
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const url = `/api/verify?serverSeed=${form.serverSeed}&clientSeed=${form.clientSeed}&nonce=${form.nonce}&dropColumn=${form.dropColumn}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">

        <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-white transition">
          <ArrowLeft size={16} className="mr-2" /> Back to Game
        </Link>

        <div>
          <h1 className="text-3xl font-extrabold text-white">Provably Fair Verifier</h1>
          <p className="text-zinc-500 mt-2">Recompute mathematical outcomes to prove that no rounds were tampered with.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Inputs */}
          <form onSubmit={handleSubmit} className="space-y-4 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Server Seed (Revealed)</label>
              <input required value={form.serverSeed} onChange={e => setForm({ ...form, serverSeed: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-sm font-mono text-zinc-300" placeholder="e.g. b2a5f3..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Client Seed</label>
              <input required value={form.clientSeed} onChange={e => setForm({ ...form, clientSeed: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-sm text-zinc-300" placeholder="candidate-hello" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Nonce</label>
                <input required value={form.nonce} onChange={e => setForm({ ...form, nonce: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-sm font-mono text-zinc-300" placeholder="42" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Drop Column</label>
                <input required type="number" min="0" max="12" value={form.dropColumn} onChange={e => setForm({ ...form, dropColumn: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-sm text-zinc-300" />
              </div>
            </div>

            <button disabled={loading} type="submit" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify Now'}
            </button>
            {error && <div className="text-red-400 text-sm p-3 bg-red-900/20 border border-red-900/50 rounded-lg">{error}</div>}
          </form>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl flex flex-col">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-zinc-800 pb-4">Verification Result</h3>

            {result ? (
              <div className="space-y-6 grow">
                <div className="flex items-start space-x-3 text-emerald-400">
                  <CheckCircle2 className="shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-400">Deterministically Verified</h4>
                    <p className="text-zinc-400 text-xs mt-1">Hashes and outcomes successfully matched the deterministic PRNG engine.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-zinc-500 uppercase font-semibold mb-1">Commit Hex (SHA256)</div>
                    <div className="break-all font-mono text-xs bg-zinc-950 p-2 rounded border border-zinc-800 text-zinc-300">{result.commitHex}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase font-semibold mb-1">Combined Seed (SHA256)</div>
                    <div className="break-all font-mono text-xs bg-zinc-950 p-2 rounded border border-zinc-800 text-zinc-300">{result.combinedSeed}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase font-semibold mb-1">Peg Map Hash</div>
                    <div className="break-all font-mono text-xs bg-zinc-950 p-2 rounded border border-zinc-800 text-zinc-300">{result.pegMapHash}</div>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-zinc-500 uppercase font-semibold mb-1">Landing Bin Index</div>
                      <div className="text-zinc-400 text-xs">Based on Path logic</div>
                    </div>
                    <div className="text-3xl font-black text-amber-400">{result.binIndex}</div>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-zinc-500 uppercase font-semibold mb-1">Payout Multiplier</div>
                      <div className="text-zinc-400 text-xs">From symmetric payout table</div>
                    </div>
                    <div className={`text-3xl font-black ${result.payoutMultiplier >= 1 ? 'text-green-400' : 'text-zinc-400'}`}>{result.payoutMultiplier}x</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grow flex flex-col items-center justify-center text-zinc-600">
                <div className="w-16 h-16 border-2 border-dashed border-zinc-700 rounded-full flex items-center justify-center mb-4">
                  <div className="w-2 h-2 bg-zinc-700 rounded-full" />
                </div>
                <p className="text-sm">Submit inputs to verify round</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <History />
        </div>

      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="bg-zinc-950 min-h-screen"></div>}>
      <VerifyFormContent />
    </Suspense>
  );
}
