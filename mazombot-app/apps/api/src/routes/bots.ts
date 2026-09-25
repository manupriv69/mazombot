import type { FastifyInstance } from "fastify";
import { prisma } from "@mazombot/db";
import { encryptToken } from "@mazombot/core";

export async function botsRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return prisma.bot.findMany({
      include: {
        _count: { select: { customers: true, transactions: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  });

  app.post("/", async (req, reply) => {
    const body = req.body as {
      telegramId: string;
      username: string;
      name: string;
      token: string;
      tag?: string;
    };

    const bot = await prisma.bot.create({
      data: {
        telegramId: body.telegramId,
        username: body.username,
        name: body.name,
        tag: body.tag,
        tokenHash: encryptToken(body.token),
      },
    });

    // O processo do serviço de bots (@mazombot/bot) escuta por bots novos
    // via polling no banco ou fila — deixado como próximo passo de
    // integração entre API e serviço de bots.

    return reply.code(201).send(bot);
  });

  app.patch("/:id/status", async (req) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: "ONLINE" | "OFFLINE" | "PAUSED" };
    return prisma.bot.update({ where: { id }, data: { status } });
  });
}
