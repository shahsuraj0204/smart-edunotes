// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Singleton pattern to ensure a single Prisma Client instance in development
const prismaClientSingleton = () => {
  return new PrismaClient();
};

// Declare a global variable for prisma in the global context
declare global {
  var prisma: PrismaClient | undefined;
}

// Check if we are in development mode and reuse the global prisma instance
const prisma = globalThis.prisma ?? prismaClientSingleton();

// If not in production, assign to global so it can be reused across hot reloads
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export default prisma;
