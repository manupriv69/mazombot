import type { FastifyInstance } from "fastify";
import { prisma } from "@mazombot/db";
import { createHmac } from "node:crypto";

/**
 * Dois sentidos aqui:
 *  1) ENTRADA: cada gateway chama /api/webhooks/gateway/:provider quando
 *     um Pix é pago — atualiza a Transaction e libera a entrega no bot.
 *  2) SAÍDA: quando um evento relevante acontece (venda aprovada, lead
 *     novo), disparamos POST assinado (HMAC) pros WebhookEndpoint
 *     cadastrados pelo usuário no painel.
 */
export async function webhooksRoutes(app: FastifyInstance) {
  app.post("/gateway/:provider", async (req, reply) => {
    const { provider } = req.params as { provider: string };
    const gateway = await prisma.gateway.findFirst({ where: { provider } });
    if (!gateway) return reply.code(404).send({ error: "gateway desconhecido" });

    // O parsing específico de cada provedor vive no respectivo adapter
    // (apps/bot/src/gateways/providers/*). Aqui só localizamos a
    // transação pelo externalId e atualizamos o status.
    const body = req.body as { id?: string; status?: string };
    if (!body.id) return reply.code(400).send({ error: "payload inválido" });

    const transaction = await prisma.transaction.findFirst({
      where: { externalId: body.id },
    });
    if (!transaction) return reply.code(404).send({ error: "transação não encontrada" });

    const isPaid = body.status?.toLowerCase() === "paid" || body.status?.toLowerCase() === "approved";

    if (isPaid && transaction.status !== "PAID") {
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: "PAID", paidAt: new Date() },
        }),
        prisma.customer.update({
          where: { id: transaction.customerId },
          data: {
            status: "ACTIVE",
            totalSpent: { increment: transaction.amount },
          },
        }),
      ]);

      await dispatchOutgoingWebhook("sale.approved", {
        transactionId: transaction.id,
        botId: transaction.botId,
        amount: transaction.amount,
      });
    }

    return reply.send({ ok: true });
  });

  app.get("/endpoints", async () => {
    return prisma.webhookEndpoint.findMany();
  });

  app.post("/endpoints", async (req, reply) => {
    const body = req.body as { url: string; events: string[] };
    const secret = createHmac("sha256", body.url).update(Date.now().toString()).digest("hex");
    const endpoint = await prisma.webhookEndpoint.create({
      data: { url: body.url, events: body.events, secret },
    });
    return reply.code(201).send(endpoint);
  });
}

async function dispatchOutgoingWebhook(event: string, payload: Record<string, unknown>) {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { active: true, events: { has: event } },
  });

  for (const endpoint of endpoints) {
    const body = JSON.stringify({ event, payload, sentAt: new Date().toISOString() });
    const signature = createHmac("sha256", endpoint.secret).update(body).digest("hex");

    fetch(endpoint.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-MazomBot-Signature": signature },
      body,
    }).catch((err) => console.warn(`[webhooks] falha ao notificar ${endpoint.url}`, err));
  }
}
