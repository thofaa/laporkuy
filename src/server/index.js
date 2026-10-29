import { Elysia, t } from "elysia";
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

const ReportBody = t.Object({
  description_raw: t.Optional(t.String({
    description: "Teks laporan. Wajib diisi (tidak boleh kosong).",
  })),
  lat: t.Optional(t.Number({
    description: "Lintang titik lokasi, -90 sampai 90. Wajib.",
  })),
  lng: t.Optional(t.Number({
    description: "Bujur titik lokasi, -180 sampai 180. Wajib.",
  })),
  address: t.Optional(t.String({
    description: "Alamat hasil geocoding (opsional, disimpan null jika kosong).",
  })),
  image_url: t.Optional(t.String({
    description: "URL gambar dari POST /api/upload-image (opsional).",
  })),
}, { additionalProperties: true });

async function proxyNominatim(endpoint, request, set) {
  const base = String(process.env.NOMINATIM_URL ?? "").replace(/\/+$/, "");
  if (!base) {
    set.status = 503;
    return { error: "nominatim_not_configured" };
  }
  const url = new URL(request.url);
  try {
    const upstream = await fetch(`${base}/${endpoint}${url.search}`, {
      headers: {
        accept: "application/json",
        "user-agent": "laporkuy/0.1 (self-hosted)",
      },
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("nominatim proxy failed", error);
    set.status = 502;
    return { error: "nominatim_unavailable" };
  }
}

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
    const { lat, lng } = body ?? {};
    if (
      !Number.isFinite(lat) || Math.abs(lat) > 90 ||
      !Number.isFinite(lng) || Math.abs(lng) > 180
    ) {
      set.status = 400;
      return { error: "location_required" };
    }
    const address = typeof body?.address === "string" && body.address.trim()
      ? body.address.trim()
      : null;
    try {
      const ticket = `LPK-${randomBytes(4).toString("hex").toUpperCase()}`;
      const [row] = await sql`
        INSERT INTO reports (ticket_number, user_id, description_raw, image_url, lat, lng, address)
        VALUES (${ticket}, ${user.id}, ${descriptionRaw}, ${body?.image_url ?? null}, ${lat}, ${lng}, ${address})
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
  }, {
    tags: ["Reports"],
    detail: {
      summary: "Kirim laporan baru",
      description: "Membuat laporan untuk user yang login (header `Authorization: Bearer <token>`). `description_raw`, `lat`, dan `lng` wajib. `lat`/`lng` harus berupa angka dalam rentang valid; jika tidak, respons `400 location_required`. Sukses: `201` dengan `{ report: { id, ticket_number, status, submitted_at } }`.",
      requestBody: {
        required: true,
        content: { "application/json": { schema: ReportBody } },
      },
      responses: {
        201: {
          description: "Laporan dibuat.",
          content: {
            "application/json": {
              example: {
                report: {
                  id: "uuid",
                  ticket_number: "LPK-1A2B3C4D",
                  status: "submitted",
                  submitted_at: "2026-10-29T10:00:00.000Z",
                },
              },
            },
          },
        },
        400: { description: "`description_required`, `location_required`, atau `user_not_found`." },
        401: { description: "`unauthorized` — token tidak ada atau tidak valid." },
        500: { description: "`submit_failed`." },
      },
    },
  })
  .get("/log", async ({ set, request }) => {
    // ponytail: user dari session; query param user_id tidak dipakai lagi (IDOR)
    const user = await getUser(request);
    if (!user) {
      set.status = 401;
      return { error: "unauthorized" };
    }
    const rows = await sql`
      SELECT id, ticket_number, description_raw, image_url, status, urgency, submitted_at,
             lat, lng, address
      FROM reports
      WHERE user_id = ${user.id}
      ORDER BY submitted_at DESC`;
    return { data: rows };
  }, {
    tags: ["Reports"],
    detail: {
      summary: "Riwayat laporan user",
      description: "Daftar laporan milik user yang login, terbaru dulu. Wajib `Authorization: Bearer <token>`. Tiap item memuat `lat`, `lng`, dan `address`.",
      responses: {
        200: {
          description: "Daftar laporan.",
          content: {
            "application/json": {
              example: {
                data: [
                  {
                    id: "uuid",
                    ticket_number: "LPK-1A2B3C4D",
                    description_raw: "Lampu jalan mati\nLokasi: Jl. Ijen",
                    image_url: null,
                    status: "submitted",
                    urgency: null,
                    submitted_at: "2026-10-29T10:00:00.000Z",
                    lat: -7.98,
                    lng: 112.63,
                    address: "Jl. Ijen, Malang",
                  },
                ],
              },
            },
          },
        },
        401: { description: "`unauthorized`." },
      },
    },
  })
  // ponytail: proxy same-origin biar Nominatim internal, tanpa CORS; jangan pernah ke nominatim.openstreetmap.org
  .get("/nominatim/search", ({ request, set }) => proxyNominatim("search", request, set), {
    tags: ["Geocoding"],
    query: t.Object({
      q: t.Optional(t.String({ description: "Teks alamat yang dicari, mis. \"Jl. Ijen Malang\"." })),
      format: t.Optional(t.String({ description: "Format Nominatim, gunakan `jsonv2`." })),
      limit: t.Optional(t.String({ description: "Jumlah hasil, mis. `1`." })),
      countrycodes: t.Optional(t.String({ description: "Batasi negara, mis. `id`." })),
      "accept-language": t.Optional(t.String({ description: "Bahasa hasil, mis. `id`." })),
    }, { additionalProperties: true }),
    detail: {
      summary: "Cari alamat (proxy Nominatim)",
      description: "Meneruskan pencarian ke instance Nominatim internal (`NOMINATIM_URL`). Browser tidak memanggil Nominatim publik. Respons mengikuti Nominatim; `503 nominatim_not_configured` jika env kosong, `502 nominatim_unavailable` jika upstream gagal.",
      responses: {
        200: { description: "Respons Nominatim diteruskan apa adanya (format `jsonv2`)." },
        502: { description: "`nominatim_unavailable` — upstream gagal dihubungi." },
        503: { description: "`nominatim_not_configured` — `NOMINATIM_URL` kosong." },
      },
    },
  })
  .get("/nominatim/reverse", ({ request, set }) => proxyNominatim("reverse", request, set), {
    tags: ["Geocoding"],
    query: t.Object({
      lat: t.Optional(t.String({ description: "Lintang titik, mis. `-7.98`." })),
      lon: t.Optional(t.String({ description: "Bujur titik, mis. `112.63`." })),
      format: t.Optional(t.String({ description: "Format Nominatim, gunakan `jsonv2`." })),
      "accept-language": t.Optional(t.String({ description: "Bahasa hasil, mis. `id`." })),
    }, { additionalProperties: true }),
    detail: {
      summary: "Alamat dari koordinat (proxy Nominatim)",
      description: "Reverse geocoding lewat instance Nominatim internal (`NOMINATIM_URL`). Respons mengikuti Nominatim; `503 nominatim_not_configured` jika env kosong, `502 nominatim_unavailable` jika upstream gagal.",
      responses: {
        200: { description: "Respons Nominatim diteruskan apa adanya (format `jsonv2`)." },
        502: { description: "`nominatim_unavailable` — upstream gagal dihubungi." },
        503: { description: "`nominatim_not_configured` — `NOMINATIM_URL` kosong." },
      },
    },
  })
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
