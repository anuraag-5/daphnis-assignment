import Controls from '@/components/Controls'
import PlinkoBoard from '@/components/PlinkoBoard'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col pt-10 px-4 max-w-7xl mx-auto">
      <header className="flex items-center justify-between pb-8 border-b border-zinc-800 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">Plinko Lab</h1>
          <p className="text-zinc-500 text-sm mt-1">Provably Fair Deterministic Gameplay</p>
        </div>
        <nav className="flex space-x-4">
          <Link href="/verify" className="px-4 py-2 border border-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-800 transition">
            ⚖️ Verifier
          </Link>
        </nav>
      </header>

      <div className="flex flex-col-reverse lg:flex-row gap-8 items-center lg:items-start justify-center">
        {/* Left: Controls */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <Controls />
          
          <div className="mt-8 p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
            <h3 className="font-semibold text-zinc-300 mb-2 text-sm uppercase tracking-wider">How to play</h3>
            <ul className="text-sm text-zinc-500 space-y-2">
              <li>1. Choose your Bet amount.</li>
              <li>2. Adjust the drop column (0-12) to influence bias.</li>
              <li>3. Click Drop to generate a provably fair result.</li>
              <li>4. Use the Verifier to mathematically prove the game.</li>
            </ul>
          </div>
        </div>

        {/* Right: Board */}
        <div className="flex-grow flex flex-col items-center w-full">
          <PlinkoBoard />
          <p className="mt-8 text-zinc-500 text-sm text-center max-w-sm">
            Curious about the maths? Click on <strong className="text-zinc-300">Verifier</strong> at the top of the page to view your past rounds and mathematically verify their fairness.
          </p>
        </div>
      </div>
    </main>
  )
}
