import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { dashboardRoutes } from "./routes/dashboard.js";
import { botsRoutes } from "./routes/bots.js";
import { webhooksRoutes } from "./routes/webhooks.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: process.env.WEB_ORIGIN ?? "*" });

await app.register(dashboardRoutes, { prefix: "/api/dashboard" });
await app.register(botsRoutes, { prefix: "/api/bots" });
await app.register(webhooksRoutes, { prefix: "/api/webhooks" });

const port = Number(process.env.PORT ?? 3001);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  console.log(`[mazombot-api] no ar em :${port}`);
});
