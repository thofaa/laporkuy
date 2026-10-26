import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import postgres from "postgres";
import index from "../../index.html";

const sql = postgres(process.env.DATABASE_URL ?? "postgres://laporkuy:laporkuy@localhost:5432/laporkuy");

const hashPassword = (pw) => {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(pw, salt, 64).toString("hex");
  return `scrypt:${salt}:${key}`;
};

const verifyPassword = (pw, stored) => {
  const [algo, salt, key] = String(stored ?? "").split(":");
  if (algo !== "scrypt") return false;
  const derived = scryptSync(pw, salt, 64);
  const keyBuf = Buffer.from(key, "hex");
  return derived.length === keyBuf.length && timingSafeEqual(derived, keyBuf);
};

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
  }))
  // ponytail: user_id dari body/query (belum ada middleware auth), ganti saat auth middleware ada
  .post("/submit-laporan", async ({ set, request }) => {
    const body = await request.json().catch(() => null);
    const descriptionRaw = String(body?.description_raw ?? "").trim();
    if (!descriptionRaw) {
      set.status = 400;
      return { error: "description_required" };
    }
    try {
      const ticket = `LPK-${randomBytes(4).toString("hex").toUpperCase()}`;
      const [row] = await sql`
        INSERT INTO reports (ticket_number, user_id, description_raw)
        VALUES (${ticket}, ${body?.user_id ?? null}, ${descriptionRaw})
        RETURNING id, ticket_number, status, submitted_at`;
      set.status = 201;
      return { report: row };
    } catch (e) {
      if (e.code === "23503" || e.code === "22P02") {
        set.status = 400;
        return { error: "user_not_found" };
      }
      set.status = 500;
      return { error: "submit_failed" };
    }
  }, { tags: ["Reports"] })
  .get("/log", async ({ set, request }) => {
    const userId = new URL(request.url).searchParams.get("user_id");
    if (!userId) {
      set.status = 400;
      return { error: "user_id_required" };
    }
    const rows = await sql`
      SELECT id, ticket_number, description_raw, status, urgency, submitted_at
      FROM reports
      WHERE user_id = ${userId}
      ORDER BY submitted_at DESC`;
    return { data: rows };
  }, { tags: ["Reports"] })
  .post("/auth/register", async ({ set, request }) => {
    const body = await request.json().catch(() => null);
    const email = String(body?.email ?? "").toLowerCase().trim();
    const password = String(body?.password ?? "");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { set.status = 400; return { error: "invalid_email" }; }
    if (password.length < 8) { set.status = 400; return { error: "weak_password" }; }
    try {
      const password_hash = hashPassword(password);
      const [row] = await sql`INSERT INTO users (email, password_hash, role, is_active, email_verified_at, full_name) VALUES (${email}, ${password_hash}, 'user', true, null, null) RETURNING *`;
      set.status = 201;
      return { user: { id: row.id, email: row.email, role: row.role } };
    } catch (e) {
      if (e.code === "23505") { set.status = 409; return { error: "email_taken" }; }
      set.status = 500;
      return { error: "register_failed" };
    }
  }, { tags: ["Auth"] })
  .post("/auth/login", async ({ set, request }) => {
    const body = await request.json().catch(() => null);
    const email = String(body?.email ?? "").toLowerCase().trim();
    const password = String(body?.password ?? "");
    if (!email || !password) { set.status = 400; return { error: "invalid_credentials" }; }
    const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (!user || !verifyPassword(password, user.password_hash)) { set.status = 401; return { error: "invalid_credentials" }; }
    if (!user.is_active) { set.status = 403; return { error: "inactive" }; }
    const token = randomBytes(32).toString("hex");
    return { token, user: { id: user.id, email: user.email, role: user.role } };
  }, { tags: ["Auth"] });

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
