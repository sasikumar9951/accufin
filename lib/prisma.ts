import { PrismaClient } from "./generated/prisma";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL!;

  // The stateless HTTP adapter uses standard native fetch()
  // This completely eliminates hung WebSocket connections and idle TCP drops.
  const adapter = new PrismaNeonHTTP(connectionString, {
    fetchOptions: {
      cache: "no-store",
    },
  });

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
