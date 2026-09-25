import type { PaymentProviderAdapter } from "../dispatcher.js";

/**
 * TODO: ajustar URL base e payload conforme a documentação oficial do
 * WiinPay. Mesmo padrão do adapter do Omega Pay — só muda o endpoint
 * e o parsing da resposta/webhook.
 */
export const wiinPayAdapter: PaymentProviderAdapter = {
  provider: "wiinpay",

  async createCharge(apiKey, req) {
    const res = await fetch("https://api.wiinpay.com.br/v1/charges", {
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
      throw new Error(`wiinpay respondeu ${res.status}`);
    }

    const data = await res.json();

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
