import { PrismaClient } from "./generated/prisma";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Set up WebSocket for Neon to support serverless connection waking
neonConfig.webSocketConstructor = ws;

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL!;
  
  // Create a Neon connection pool
  const pool = new Pool({ connectionString });
  
  // Wrap into the Prisma adapter
  const adapter = new PrismaNeon(pool);

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
