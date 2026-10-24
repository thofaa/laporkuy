import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import index from "../../index.html";

const api = new Elysia({ prefix: "/api" })
  .use(swagger({ path: "/docs" }))
  .get("/health", () => ({
    status: "ok",
    service: "laporkuy",
    time: new Date().toISOString(),
  }))
  // ponytail: statis, ganti dengan agregasi DB nyata saat backend chat ada
  .get("/chat-stats", () => ({
    data: [
      { name: "Resolved", value: 912 },
      { name: "Active", value: 214 },
      { name: "Waiting", value: 118 },
      { name: "Escalated", value: 40 },
    ],
  }));

const port = Number(Bun.env.PORT ?? 3000);

Bun.serve({
  port,
  development: Bun.env.NODE_ENV !== "production",
  routes: {
    "/api/*": api.handle,
    "/*": index,
  },
});

console.log(`Laporkuy running at http://localhost:${port}`);
