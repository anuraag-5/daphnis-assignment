# Plinko Lab (Provably Fair)

A full-stack, provably-fair deterministic Plinko game powered by a commit-reveal RNG protocol.

## How to run locally

### Prisma Setup
Since we use PostgreSQL with Prisma, make sure your `.env` contains:
```env
DATABASE_URL="postgresql://plinko_admin:plinko_password@localhost:5432/plinko_db?schema=public"
```
Or pointing to your cloud instance.
Generate schema and push to your database using:
```bash
npx prisma generate
npx prisma db push
```

### Dev Server
```bash
npm install
npm run dev
```
Navigate to `http://localhost:3000`.

## Architecture overview
- **Frontend**: Next.js 14+ App Router, React, Tailwind CSS, Framer Motion (animations), Canvas Confetti.
- **Backend API**: Next.js Serverless API endpoints handling round states (`CREATE`, `STARTED`, `REVEALED`).
- **Database**: PostgreSQL with Prisma.
- **Fairness Engine**: Contains `Xorshift32` implementation for seeding arrays of probabilities deterministically off `combinedSeed`.

## Fairness Spec
The fairness protocol uses a **Commit-Reveal scheme**:
1. Before the round, the server generates a cryptographically random `serverSeed` (stored securely) and a `nonce` (`actualNonce`).
2. Server responds with a SHA256 `commitHex = SHA256(serverSeed:nonce)`.
3. The client inputs their own `clientSeed` and starts the game.
4. Server computes `combinedSeed = SHA256(serverSeed:clientSeed:nonce)`.
5. The `combinedSeed` seeds our mathematical deterministic `Xorshift32` Plinko engine. Paths and multipliers are extracted.
6. Server reveals the `serverSeed`. 
7. Anyone can deterministically trace the output path via the `/verify` page!

## AI Usage
The codebase was architected, written, and validated extensively using Agentic AI assistance.
- **Plan Phase**: Formulated the commit-reveal schema and App Router logic mapping.
- **Execution Phase**: 
  - Iteratively drafted Prisma schema + backend Next.js API endpoints.
  - Corrected imports and TypeScript Promise issues in App Router APIs via trial and error.
  - Used `eslint` and `Next.js` build outputs locally to resolve typing issues.

## Time Log
- 0:00 - 1:00 : Architecture formulation, Docker setup, and Next.js boilerplate mapping.
- 1:00 - 4:00 : Xorshift32 implementation, discrete plinko maths based strictly on test vectors (matching exactly `0.422123` via Math.round!).
- 4:00 - 6:00 : API endpoints implementations.
- 6:00 - 8:00 : Frontend polish, interactive framer-motion UI, and Verifier visual page hookup.
