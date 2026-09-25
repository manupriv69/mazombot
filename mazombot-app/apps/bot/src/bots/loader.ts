import { Bot as Telegraf } from "grammy";
import { prisma } from "@mazombot/db";
import { decryptToken } from "@mazombot/core";
import { buildFlowRouter } from "../flows/router.js";

/**
 * Um único processo Node sobe N instâncias de bot em paralelo (long polling).
 * Isso é suficiente até algumas dezenas de bots. Se um dia passar disso,
 * a saída é separar workers por grupo de bots — não precisa reescrever nada,
 * só mudar como essa função é chamada (por partição em vez de "todos").
 */

const runningBots = new Map<string, Telegraf>();

export function getRunningBots() {
  return runningBots;
}

export async function startAllBots(mode: "polling" | "webhook" = "polling") {
  const bots = await prisma.bot.findMany({ where: { status: "ONLINE" } });

  for (const botRecord of bots) {
    await startBot(botRecord.id, mode);
  }

  console.log(`[bots] ${runningBots.size} bot(s) online (modo ${mode})`);
}

export async function startBot(botId: string, mode: "polling" | "webhook" = "polling") {
  const botRecord = await prisma.bot.findUniqueOrThrow({ where: { id: botId } });

  if (runningBots.has(botRecord.id)) {
    console.warn(`[bots] ${botRecord.username} já está rodando, ignorando`);
    return;
  }

  const token = decryptToken(botRecord.tokenHash);
  const bot = new Telegraf(token);

  // Cada bot carrega o próprio roteador de fluxos (boas-vindas, upsell,
  // downsell, order bump, prévia) configurado no painel.
  await buildFlowRouter(bot, botRecord.id);

  bot.catch((err) => {
    console.error(`[bots] erro no bot ${botRecord.username}:`, err.error);
  });

  if (mode === "polling") {
    // Long polling: fica com uma conexão aberta pra sempre — bom em VPS,
    // ruim em serviço free que dorme sem tráfego HTTP.
    await bot.start({
      onStart: () => console.log(`[bots] ${botRecord.username} conectado (polling)`),
    });
  } else {
    // Webhook: o Telegram manda a mensagem via HTTP quando acontece —
    // isso "acorda" um serviço free do Render em vez de precisar ficar
    // sempre ligado. bot.init() só carrega os dados do bot (botInfo),
    // sem abrir conexão de polling.
    await bot.init();
    console.log(`[bots] ${botRecord.username} pronto (webhook)`);
  }

  runningBots.set(botRecord.id, bot);
}

export async function stopBot(botId: string) {
  const bot = runningBots.get(botId);
  if (!bot) return;
  await bot.stop();
  runningBots.delete(botId);
}
