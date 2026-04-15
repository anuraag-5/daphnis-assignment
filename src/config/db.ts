import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/index.js';
import { PrismaNeon } from '@prisma/adapter-neon';

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
})

export const prisma = new PrismaClient({ adapter });
// const connectDB = async () => {
//   try {
//     await prisma.$connect();
//     console.log('PostgreSQL connected via Prisma');
//   } catch (err) {
//     console.error('PostgreSQL connection error:', err.message);
//     // process.exit(1); // Commented out to allow server to start without DB
//   }
// };