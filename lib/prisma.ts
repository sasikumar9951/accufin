import { PrismaClient } from './generated/prisma';

const prismaClientSingleton = () => {
  const client = new PrismaClient();
  console.warn('PRISMA CLIENT INSTANTIATED');
  return client;
}

declare global {
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export default prisma;