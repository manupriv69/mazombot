import type { FastifyInstance } from "fastify";
import { prisma } from "@mazombot/db";

/**
 * Cobre exatamente os cards do dashboard do MazomBot: vendas hoje/mês/ano,
 * faturamento, ticket médio, conversão, leads, ativos, convertidos, perdidos.
 * Tudo derivado de Transaction + Customer — sem tabela própria de "métricas".
 */
export async function dashboardRoutes(app: FastifyInstance) {
  app.get("/overview", async (req) => {
    const { botId } = req.query as { botId?: string };
    const botFilter = botId ? { botId } : {};

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [salesToday, salesMonth, salesYear, allPaid, leadsTotal, activeCustomers] =
      await Promise.all([
        sumPaid(botFilter, startOfToday),
        sumPaid(botFilter, startOfMonth),
        sumPaid(botFilter, startOfYear),
        sumPaid(botFilter),
        prisma.customer.count({ where: botFilter }),
        prisma.customer.count({ where: { ...botFilter, status: "ACTIVE" } }),
      ]);

    const paidCount = await prisma.transaction.count({
      where: { ...botFilter, status: "PAID" },
    });
    const totalCount = await prisma.transaction.count({ where: botFilter });
    const lostCount = await prisma.transaction.count({
      where: { ...botFilter, status: { in: ["FAILED", "EXPIRED"] } },
    });

    const conversionRate = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
    const avgTicket = paidCount > 0 ? allPaid / paidCount : 0;

    return {
      salesToday,
      salesMonth,
      salesYear,
      revenue: allPaid,
      avgTicket,
      conversionRate,
      leadsTotal,
      activeCustomers,
      converted: paidCount,
      lost: lostCount,
    };
  });

  app.get("/top-bots", async () => {
    const results = await prisma.transaction.groupBy({
      by: ["botId"],
      where: { status: "PAID" },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    });

    const bots = await prisma.bot.findMany({
      where: { id: { in: results.map((r) => r.botId) } },
    });

    return results.map((r) => ({
      bot: bots.find((b) => b.id === r.botId),
      revenue: r._sum.amount,
    }));
  });

  app.get("/top-gateways", async () => {
    const results = await prisma.transaction.groupBy({
      by: ["gatewayId"],
      where: { status: "PAID", gatewayId: { not: null } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    });

    const gateways = await prisma.gateway.findMany({
      where: { id: { in: results.map((r) => r.gatewayId!) } },
    });

    return results.map((r) => ({
      gateway: gateways.find((g) => g.id === r.gatewayId),
      revenue: r._sum.amount,
    }));
  });
}

async function sumPaid(botFilter: { botId?: string }, since?: Date) {
  const result = await prisma.transaction.aggregate({
    where: { ...botFilter, status: "PAID", ...(since ? { paidAt: { gte: since } } : {}) },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}
