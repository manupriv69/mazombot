# MazomBot — Sales OS

Gerenciador de múltiplos bots de venda no Telegram: funil, pagamento com
fallback entre gateways, CRM, remarketing e dashboard.

## Arquitetura

Monorepo com 3 serviços + 3 pacotes compartilhados:

```
apps/
  bot/   → serviço que sobe todos os bots (grammY) e roda o funil de vendas
  api/   → API (Fastify) que serve o dashboard e recebe webhooks de gateway
  web/   → dashboard (Next.js), identidade visual fiel ao protótipo MazomBot
packages/
  db/    → schema Prisma + client compartilhado (bots, fluxos, clientes,
           transações, gateways, remarketing, webhooks)
  core/  → utilitário de criptografia (tokens de bot e chaves de gateway)
```

Financeiro e Análises **não têm tabela própria** — são derivados de
`Transaction` em tempo real (ver `apps/api/src/routes/dashboard.ts`). Isso
evita dado duplicado e deixa a lógica de negócio num lugar só.

### Fluxo de uma venda

1. Lead manda `/start` no bot → vira `Customer` com status `LEAD`
2. Bot mostra os planos do `Flow` tipo `WELCOME`
3. Cliente escolhe um plano → cria `Transaction` `PENDING` →
   `apps/bot/src/gateways/dispatcher.ts` tenta os gateways ativos em ordem
   de prioridade até um responder (fallback automático)
4. Se não pagar dentro do timer do `Flow` tipo `DOWNSELL`, entra na fila
   de reengajamento (BullMQ)
5. Gateway confirma pagamento → `POST /api/webhooks/gateway/:provider` →
   `Transaction` vira `PAID`, `Customer` vira `ACTIVE`, dispara webhook de
   saída pros endpoints cadastrados pelo usuário

## Rodando local

Pré-requisito: Postgres e Redis rodando (local ou Docker avulso — não
precisa de Docker Compose pra dev, só pra quem preferir).

```bash
npm install

cp apps/bot/.env.example apps/bot/.env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# gerar a ENCRYPTION_KEY e colar nos dois .env acima
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

npm run db:generate
npm run db:migrate

npm run dev:api   # :3001
npm run dev:web   # :3000
npm run dev:bot   # long polling — só sobe bots com status ONLINE no banco
```

## Deploy no Railway

Cada `apps/*` vira um serviço Railway separado, todos apontando pro mesmo
repo com **root directory** diferente:

| Serviço Railway | Root Directory | Start Command      |
| ---------------- | --------------- | ------------------- |
| mazombot-api      | `apps/api`       | `npm run build && npm start` |
| mazombot-bot      | `apps/bot`       | `npm run build && npm start` |
| mazombot-web      | `apps/web`       | `npm run build && npm start` |

Adiciona os plugins **PostgreSQL** e **Redis** do próprio Railway — eles
geram `DATABASE_URL` e `REDIS_URL` automaticamente, só referenciar nas
env vars dos serviços (`${{Postgres.DATABASE_URL}}` etc). Cada serviço
precisa das envs do seu `.env.example` correspondente + a mesma
`ENCRYPTION_KEY` em todos.

## Próximos passos (não implementados ainda)

- Adapters de gateway (`apps/bot/src/gateways/providers/*`) estão com
  endpoint placeholder — ajustar pra URL/payload reais do Omega Pay,
  WiinPay e SyncPay conforme a documentação de cada um
- Envio da mensagem de downsell propriamente dita (o job já dispara no
  tempo certo, falta plugar o `bot.api.sendMessage`)
- Módulo de Remarketing (campanhas agendadas em massa) — schema pronto,
  worker ainda não escrito
- Autenticação do dashboard (hoje a API não exige login)
