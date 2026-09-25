import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@mazombot/db";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const downsellQueue = new Queue("downsell", { connection });

type DownsellJob = {
  botId: string;
  customerId: string;
  transactionId: string;
};

/**
 * Agenda a checagem de downsell. O delay vem do Flow tipo DOWNSELL
 * configurado no painel (ex: 5 minutos) — se não tiver nenhum configurado,
 * usa 10 min como padrão razoável.
 */
export async function scheduleDownsell(job: DownsellJob) {
  const downsellFlow = await prisma.flow.findFirst({
    where: { botId: job.botId, type: "DOWNSELL", isActive: true },
  });

  const config = downsellFlow?.config as { delayMinutes?: number } | undefined;
  const delayMinutes = config?.delayMinutes ?? 10;

  await downsellQueue.add("check-and-reengage", job, {
    delay: delayMinutes * 60 * 1000,
    removeOnComplete: true,
    attempts: 1,
  });
}

/**
 * Worker roda num processo separado (ver src/workers/downsell.ts) pra não
 * competir por CPU com o long polling dos bots.
 */
export function startDownsellWorker() {
  return new Worker<DownsellJob>(
    "downsell",
    async (job) => {
      const transaction = await prisma.transaction.findUnique({
        where: { id: job.data.transactionId },
      });

      // Já pagou — nada a fazer, a sequência de downsell não dispara.
      if (!transaction || transaction.status !== "PENDING") return;

      // A partir daqui: enviar a mensagem de downsell configurada (desconto,
      // nova oferta) usando o bot correspondente. Deixado como próximo passo
      // de integração — o gancho de dados (customer, transaction, flow) já
      // está todo pronto aqui.
      console.log(
        `[downsell] cliente ${job.data.customerId} não pagou, disparar reengajamento`
      );
    },
    { connection }
  );
}
