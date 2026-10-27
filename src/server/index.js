import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import postgres from "postgres";
import { Client as MinioClient } from "minio";
import index from "../../index.html";

const sql = postgres(process.env.DATABASE_URL ?? "postgres://laporkuy:laporkuy@localhost:5432/laporkuy");

const MINIO_BUCKET = "laporkuy";
const minio = new MinioClient({
  endPoint: Bun.env.MINIO_ENDPOINT ?? "localhost",
  port: Number(Bun.env.MINIO_PORT ?? 9000),
  useSSL: false,
  accessKey: Bun.env.MINIO_ACCESS_KEY ?? "laporkuy",
  secretKey: Bun.env.MINIO_SECRET_KEY ?? "laporkuy123",
});

async function ensureBucket() {
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      if (!(await minio.bucketExists(MINIO_BUCKET))) {
        await minio.makeBucket(MINIO_BUCKET);
      }
      // ponytail: policy read-anonimy tidak fatal — dukungan SeaweedFS parsial
      try {
        await minio.setBucketPolicy(MINIO_BUCKET, JSON.stringify({
          Version: "2012-10-17",
          Statement: [{
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`],
          }],
        }));
      } catch (e) {
        console.error("bucket policy skipped", e.message);
      }
      return;
    } catch (error) {
      if (attempt === 9) throw error;
      await Bun.sleep(1000);
    }
  }
}

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

// ponytail: token di tabel sessions tanpa expiry; tambah expires_at saat dibutuhkan
const getUser = async (request) => {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const [row] = await sql`
    SELECT u.id, u.email, u.role FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token}`;
  return row ?? null;
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
    // ponytail: auth dari session, bukan body.user_id
    const user = await getUser(request);
    if (!user) {
      set.status = 401;
      return { error: "unauthorized" };
    }
    const body = await request.json().catch(() => null);
    const descriptionRaw = String(body?.description_raw ?? "").trim();
    if (!descriptionRaw) {
      set.status = 400;
      return { error: "description_required" };
    }
    try {
      const ticket = `LPK-${randomBytes(4).toString("hex").toUpperCase()}`;
      const [row] = await sql`
        INSERT INTO reports (ticket_number, user_id, description_raw, image_url)
        VALUES (${ticket}, ${user.id}, ${descriptionRaw}, ${body?.image_url ?? null})
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
    // ponytail: user dari session; query param user_id tidak dipakai lagi (IDOR)
    const user = await getUser(request);
    if (!user) {
      set.status = 401;
      return { error: "unauthorized" };
    }
    const rows = await sql`
      SELECT id, ticket_number, description_raw, image_url, status, urgency, submitted_at
      FROM reports
      WHERE user_id = ${user.id}
      ORDER BY submitted_at DESC`;
    return { data: rows };
  }, { tags: ["Reports"] })
  .post("/upload-image", async ({ set, request }) => {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) {
      set.status = 400;
      return { error: "file_required" };
    }
    const EXTENSIONS = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
    const ext = EXTENSIONS[file.type];
    if (!ext) {
      set.status = 400;
      return { error: "invalid_type" };
    }
    if (file.size > 5 * 1024 * 1024) {
      set.status = 400;
      return { error: "file_too_large" };
    }
    try {
      await ensureBucket();
      const key = `${randomBytes(8).toString("hex")}.${ext}`;
      await minio.putObject(
        MINIO_BUCKET,
        key,
        Buffer.from(await file.arrayBuffer()),
        file.size,
        { "Content-Type": file.type },
      );
      set.status = 201;
      return { image_url: `/uploads/${MINIO_BUCKET}/${key}` };
    } catch (error) {
      console.error("upload failed", error);
      set.status = 500;
      return { error: "upload_failed" };
    }
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
    await sql`INSERT INTO sessions (token, user_id) VALUES (${token}, ${user.id})`;
    return { token, user: { id: user.id, email: user.email, role: user.role } };
  }, { tags: ["Auth"] })
  .post("/auth/logout", async ({ set, request }) => {
    const auth = request.headers.get("authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (token) await sql`DELETE FROM sessions WHERE token = ${token}`;
    return { ok: true };
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
