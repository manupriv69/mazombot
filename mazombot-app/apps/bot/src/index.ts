import "dotenv/config";
import { createServer } from "node:http";
import { webhookCallback } from "grammy";
import { startAllBots, getRunningBots } from "./bots/loader.js";
import { startDownsellWorker } from "./flows/downsell-queue.js";

// Se WEBHOOK_BASE_URL estiver definida (ex: no Render), roda em modo
// webhook. Sem essa env, roda em long polling normal (bom pra rodar
// local ou numa VPS).
const webhookBase = process.env.WEBHOOK_BASE_URL;

async function main() {
  if (webhookBase) {
    await startAllBots("webhook");
    const bots = getRunningBots();

    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", "http://localhost");

      // Endpoint que um serviço de ping externo (UptimeRobot, cron-job.org)
      // deve chamar a cada 10 min pra evitar o serviço free dormir.
      if (url.pathname === "/health") {
        res.writeHead(200);
        res.end("ok");
        return;
      }

      const match = url.pathname.match(/^\/webhook\/(.+)$/);
      const bot = match ? bots.get(match[1]) : undefined;

      if (!bot) {
        res.writeHead(404);
        res.end();
        return;
      }

      return webhookCallback(bot, "http")(req, res);
    });

    const port = Number(process.env.PORT ?? 3000);
    server.listen(port, () => console.log(`[mazombot-bot] webhook server em :${port}`));

    for (const [botId, bot] of bots) {
      await bot.api.setWebhook(`${webhookBase}/webhook/${botId}`);
    }
  } else {
    await startAllBots("polling");
  }

  startDownsellWorker();
  console.log("[mazombot-bot] serviço no ar");
}

main().catch((err) => {
  console.error("[mazombot-bot] falha ao iniciar:", err);
  process.exit(1);
});
