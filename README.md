# Plinko Lab -- Provably Fair

A full-stack provably-fair Plinko game built with Next.js 16, Prisma/PostgreSQL, and a deterministic Xorshift32 engine.

## Links

- Live app: https://daphnis-assignment.vercel.app
- Verifier page: https://daphnis-assignment.vercel.app/verify
- Example round permalink (paste any revealed round's seeds into the verifier):
  `https://daphnis-assignment.vercel.app/verify?serverSeed=<serverSeed>&clientSeed=<clientSeed>&nonce=<nonce>&dropColumn=<col>`

---

## How to run locally

### Prerequisites

- Node.js 20.9+
- PostgreSQL (or use the provided Docker Compose)

### 1. Start the database

```bash
docker-compose up -d
```

### 2. Environment variables

Copy `.env` and set:

```env
DATABASE_URL="postgresql://plinko_admin:plinko_password@localhost:5432/plinko_db?schema=public"
```

### 3. Install & migrate

```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

### 4. Run

```bash
npm run dev
# → http://localhost:3000
```

### 5. Tests

```bash
npm test
```

---

## Architecture

```
Browser (Next.js Client Components)
  │  Zustand store (store.ts) : game state machine
  │
  ▼
Next.js App Router API Routes (src/app/api/)
  ├── POST /api/rounds/commit      : generate serverSeed + nonce, return commitHex
  ├── POST /api/rounds/[id]/start  : accept clientSeed, run fairness engine, store path
  ├── POST /api/rounds/[id]/reveal : flip status to REVEALED, expose serverSeed
  ├── GET  /api/rounds/[id]        : fetch round details
  ├── GET  /api/rounds             : list revealed rounds (history)
  └── GET  /api/verify             : stateless re-computation for verification
  │
  ▼
Prisma ORM → PostgreSQL
  Round model: id, status, serverSeed, clientSeed, nonce, commitHex,
               combinedSeed, pegMapHash, dropColumn, binIndex,
               payoutMultiplier, betCents, pathJson, rows, revealedAt
```

**Key libraries:** framer-motion (ball animation), canvas-confetti, Zustand, Tailwind CSS v4, Lucide icons.

---

## Fairness Spec

### Commit-Reveal Protocol

1. **Commit** — Server generates `serverSeed = crypto.randomBytes(32)` and `nonce = crypto.randomBytes(8)`. Returns `commitHex = SHA256(serverSeed:nonce)` to the client. The serverSeed is stored but never sent.
2. **Start** — Client provides `clientSeed`. Server computes `combinedSeed = SHA256(serverSeed:clientSeed:nonce)` and runs the engine.
3. **Reveal** — After animation, server exposes `serverSeed`. Anyone can recompute `commitHex` to confirm it was not changed post-bet.

### Deterministic Engine

```
combinedSeed  →  first 4 bytes as uint32  →  Xorshift32 PRNG seed
```

**Xorshift32** (period 2³²−1):
```
x ^= x << 13
x ^= x >>> 17
x ^= x << 5
```

**Peg map** — For each of 12 rows, for each peg in that row, draw one float from the PRNG and compute:
```
rawBias  = 0.5 + (nextFloat() − 0.5) × 0.2   // range [0.4, 0.6]
bias     = round(rawBias × 1_000_000) / 1_000_000
```
The bias is the probability of the ball going **left** at that peg. The full map is hashed: `pegMapHash = SHA256(JSON.stringify(pegMap))`.

**Path simulation** — Starting at position 0, for each row:
```
adj      = (rows/2 − dropColumn) × 0.01   // dropColumn shifts distribution
adjBias  = clamp(bias + adj, 0, 1)
rnd      = nextFloat()
decision = rnd < adjBias ? LEFT(0) : RIGHT(1)
```
`binIndex = sum(decisions)` — the final landing bin (0–12).

**Payout table** (symmetric, 13 bins):
```
[10, 5, 2, 1.5, 1, 0.5, 0.2, 0.5, 1, 1.5, 2, 5, 10]
```

**Verification** — The `/verify` page (and `/api/verify`) re-runs the entire computation client-side from the revealed seeds and confirms `binIndex` and `payoutMultiplier` match the stored round.

**Known test vector:**
```
serverSeed  = b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc
nonce       = 42
clientSeed  = candidate-hello
commitHex   = bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34
combinedSeed= e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0
pegMap[0]   = [0.422123]
binIndex    = 6  (dropColumn=6)
```

---

## Where / How AI Was Used

All code was written with Kiro (AI coding assistant). Key interactions:

- **Architecture** : Prompted for commit-reveal schema design and Next.js 16 App Router API route structure.
- **Fairness engine** : Iteratively validated Xorshift32 output against the known test vector (`pegMap[0][0] === 0.422123`). Caught and fixed an inverted `dropColumn` bias sign (was `dropColumn − rows/2`, should be `rows/2 − dropColumn`).
- **API routes** : AI drafted all route handlers; async `params` pattern for Next.js 16 was applied correctly from the start.
- **Frontend** : Framer Motion animation sequence, Zustand state machine, and Tailwind layout all AI-generated with manual review.
- **Easter eggs** : TILT mode (press T) and Golden Ball (3 consecutive center landings) added via a separate `easterEggs.ts` Zustand store.
- **Tests** : AI wrote the full vitest suite; the bias direction test caught the real engine bug above.

What was kept vs changed: the core Xorshift32 math and SHA256 chaining were kept as-is after test vector validation. The `dropColumn` bias sign was corrected. A dead `nonce = '1'` variable in the commit route was removed. The verifier was extended to show `payoutMultiplier`.

---

**What I'd do with more time:**
- Per-user nonce incrementing (currently random per round)
- WebSocket live multiplayer spectating
- More robust balance system with server-side enforcement
- Expand test coverage to include API route integration tests
- Add `aria-live` regions for the animation result announcement
