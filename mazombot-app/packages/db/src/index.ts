import { PrismaClient } from "@prisma/client";

// Evita múltiplas instâncias do client em dev (hot reload) — padrão
// recomendado pelo próprio Prisma.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
