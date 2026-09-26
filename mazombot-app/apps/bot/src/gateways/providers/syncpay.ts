import type { PaymentProviderAdapter } from "../dispatcher.js";

/**
 * TODO: ajustar URL base e payload conforme a documentação oficial do
 * SyncPay. Mesmo padrão do adapter do Omega Pay — só muda o endpoint
 * e o parsing da resposta/webhook.
 */
export const syncPayAdapter: PaymentProviderAdapter = {
  provider: "sync_pay",

  async createCharge(apiKey, req) {
    const res = await fetch("https://api.syncpay.com.br/v1/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        amount: req.amountCents,
        description: req.description,
        external_reference: req.transactionId,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`sync_pay respondeu ${res.status}`);
    }

    const data = (await res.json()) as { id: string; pix_copy_paste: string };

    return {
      externalId: data.id,
      pixCopyPaste: data.pix_copy_paste,
    };
  },

  parseWebhook(payload) {
    const body = payload as { id?: string; status?: string };
    if (!body.id || !body.status) return null;

    const map: Record<string, "PAID" | "FAILED" | "EXPIRED"> = {
      paid: "PAID",
      approved: "PAID",
      failed: "FAILED",
      expired: "EXPIRED",
    };

    const status = map[body.status.toLowerCase()];
    if (!status) return null;

    return { externalId: body.id, status };
  },
};
