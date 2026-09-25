import { prisma } from "@mazombot/db";
import { decryptToken } from "@mazombot/core";
import { omegaPayAdapter } from "./providers/omega-pay.js";
import { wiinPayAdapter } from "./providers/wiinpay.js";
import { syncPayAdapter } from "./providers/syncpay.js";

/**
 * Todo provedor de pagamento implementa essa interface. Adicionar um novo
 * gateway é só escrever um adapter novo e registrar no `adapters` abaixo —
 * o dispatcher e o resto do sistema não mudam.
 */
export type ChargeRequest = {
  transactionId: string;
  amountCents: number;
  description: string;
};

export type ChargeResult = {
  gatewayId: string;
  externalId: string;
  pixCopyPaste: string;
};

export interface PaymentProviderAdapter {
  provider: string;
  createCharge(apiKey: string, req: ChargeRequest): Promise<Omit<ChargeResult, "gatewayId">>;
  parseWebhook(payload: unknown): { externalId: string; status: "PAID" | "FAILED" | "EXPIRED" } | null;
}

const adapters: Record<string, PaymentProviderAdapter> = {
  omega_pay: omegaPayAdapter,
  wiinpay: wiinPayAdapter,
  sync_pay: syncPayAdapter,
};

/**
 * Tenta os gateways ativos em ordem de prioridade (menor número primeiro).
 * Se um falhar (timeout, erro 5xx, credencial inválida), tenta o próximo
 * automaticamente. Só lança erro se TODOS falharem.
 */
export async function createCharge(req: ChargeRequest): Promise<ChargeResult> {
  const gateways = await prisma.gateway.findMany({
    where: { active: true },
    orderBy: { priority: "asc" },
  });

  if (gateways.length === 0) {
    throw new Error("Nenhum gateway ativo configurado");
  }

  const failures: string[] = [];

  for (const gateway of gateways) {
    const adapter = adapters[gateway.provider];
    if (!adapter) {
      failures.push(`${gateway.provider}: adapter não implementado`);
      continue;
    }

    try {
      const apiKey = decryptToken(gateway.apiKeyEnc);
      const result = await adapter.createCharge(apiKey, req);
      return { ...result, gatewayId: gateway.id };
    } catch (err) {
      failures.push(`${gateway.provider}: ${(err as Error).message}`);
      console.warn(`[gateways] falha em ${gateway.provider}, tentando próximo`, err);
      continue;
    }
  }

  throw new Error(`Todos os gateways falharam: ${failures.join(" | ")}`);
}
