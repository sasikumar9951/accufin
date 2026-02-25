import { PrismaClient } from "./generated/prisma";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Create a native Node.js pg Pool. This completely bypasses Prisma's Rust execution engine
// and fixes the AWS silent connection drops by destroying idle connections after 30 seconds.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL as string,
  max: 3, // match the connection limit
  idleTimeoutMillis: 30000, // DESTROY connection after 30s of inactivity. Never hits AWS 350s firewall limit.
  connectionTimeoutMillis: 5000, // Fail fast in 5s instead of hanging for 60s
});

const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    adapter,
    log: ["error"],
  });

  return client;
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
