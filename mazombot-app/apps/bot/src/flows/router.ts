import type { Bot } from "grammy";
import { InlineKeyboard } from "grammy";
import { prisma } from "@mazombot/db";
import { createCharge } from "../gateways/dispatcher.js";
import { scheduleDownsell } from "./downsell-queue.js";

/**
 * O funil inteiro é dirigido pelo JSON salvo em Flow.config — o painel
 * (dashboard) é quem escreve esse JSON, esse arquivo só interpreta.
 * Formato esperado de um Flow do tipo WELCOME:
 *
 * {
 *   "message": "texto de boas-vindas com {{first_name}}",
 *   "mediaFileId": "...", // opcional, file_id já upado no Telegram
 *   "plans": [
 *     { "id": "vip_mensal", "label": "VIP Mensal", "priceCents": 2990 },
 *     { "id": "vip_vitalicio", "label": "VIP Vitalício", "priceCents": 9990 }
 *   ]
 * }
 */

type WelcomeConfig = {
  message: string;
  mediaFileId?: string;
  plans: { id: string; label: string; priceCents: number }[];
};

export async function buildFlowRouter(bot: Bot, botId: string) {
  bot.command("start", async (ctx) => {
    await upsertLead(botId, ctx);

    const welcome = await prisma.flow.findFirst({
      where: { botId, type: "WELCOME", isActive: true },
    });

    if (!welcome) {
      await ctx.reply("Bem-vindo! (nenhum fluxo de boas-vindas configurado ainda)");
      return;
    }

    const config = welcome.config as unknown as WelcomeConfig;
    const keyboard = new InlineKeyboard();
    for (const plan of config.plans) {
      keyboard
        .text(`${plan.label} — R$ ${(plan.priceCents / 100).toFixed(2)}`, `buy:${plan.id}`)
        .row();
    }

    const text = config.message.replace("{{first_name}}", ctx.from?.first_name ?? "");

    if (config.mediaFileId) {
      await ctx.replyWithPhoto(config.mediaFileId, { caption: text, reply_markup: keyboard });
    } else {
      await ctx.reply(text, { reply_markup: keyboard });
    }
  });

  bot.callbackQuery(/^buy:(.+)$/, async (ctx) => {
    const planId = ctx.match[1];
    await ctx.answerCallbackQuery();

    const welcome = await prisma.flow.findFirstOrThrow({
      where: { botId, type: "WELCOME", isActive: true },
    });
    const config = welcome.config as unknown as WelcomeConfig;
    const plan = config.plans.find((p) => p.id === planId);
    if (!plan) return;

    const customer = await prisma.customer.findUniqueOrThrow({
      where: { botId_telegramUserId: { botId, telegramUserId: String(ctx.from.id) } },
    });

    const transaction = await prisma.transaction.create({
      data: {
        botId,
        customerId: customer.id,
        amount: plan.priceCents / 100,
        planName: plan.label,
        status: "PENDING",
      },
    });

    // Tenta os gateways em ordem de prioridade até um responder (fallback).
    const charge = await createCharge({
      transactionId: transaction.id,
      amountCents: plan.priceCents,
      description: plan.label,
    });

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { externalId: charge.externalId, gatewayId: charge.gatewayId },
    });

    await ctx.reply(
      `Pix gerado para *${plan.label}*\n\n\`${charge.pixCopyPaste}\`\n\nApós o pagamento a liberação é automática.`,
      { parse_mode: "Markdown" }
    );

    // Se não pagar dentro do timer configurado no Downsell, entra na
    // sequência de reengajamento com desconto — ver módulo Downsell.
    await scheduleDownsell({ botId, customerId: customer.id, transactionId: transaction.id });
  });
}

async function upsertLead(botId: string, ctx: { from?: { id: number; first_name?: string; username?: string } }) {
  if (!ctx.from) return;
  await prisma.customer.upsert({
    where: { botId_telegramUserId: { botId, telegramUserId: String(ctx.from.id) } },
    update: { lastInteraction: new Date() },
    create: {
      botId,
      telegramUserId: String(ctx.from.id),
      firstName: ctx.from.first_name,
      username: ctx.from.username,
      status: "LEAD",
    },
  });
}
