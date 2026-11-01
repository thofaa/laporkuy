import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { randomBytes } from "node:crypto";
import { hashPassword, safeUser, verifyPassword } from "./auth.js";
import { createDemoStore } from "./demo-store.js";
import { createPostgresStore } from "./postgres-store.js";
import { saveImage } from "./storage.js";
import { canManage, publicReport, validateUpdate } from "../shared/reports.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const tokenOf = request => request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1] ?? "";
const fail = (set, status, error) => { set.status = status; return { error }; };
const visible = r => r.is_public && r.moderation_status === "published";

export function createApi({ demo = Bun.env.DEMO_MODE === "true", store = demo ? createDemoStore() : createPostgresStore() } = {}) {
  const currentUser = request => store.session(tokenOf(request));
  return new Elysia({ prefix: "/api" })
    .use(swagger({ path: "/docs" }))
    .onError(({ code, error, set }) => {
      if (code === "NOT_FOUND") return fail(set, 404, "Alamat API tidak ditemukan.");
      console.error("API error:", error.message);
      return fail(set, code === "VALIDATION" || code === "PARSE" ? 400 : 500,
        "Permintaan gagal. Periksa koneksi database dan jalankan migrasi, lalu coba kembali.");
    })
    .get("/health", () => ({ status: "ok", service: "laporkuy" }))
    .get("/meta", () => ({ demo, demo_accounts: demo ? [
      { label: "Masyarakat", email: "warga@demo.test", password: "WargaDemo123!" },
      { label: "Admin pemerintah", email: "admin@demo.test", password: "AdminDemo123!" },
      { label: "Petugas dinas PU", email: "petugas@demo.test", password: "PetugasDemo123!" },
    ] : [] }))
    .post("/auth/register", async ({ body, set }) => {
      const email = String(body?.email ?? "").trim().toLowerCase();
      const password = String(body?.password ?? "");
      const fullName = String(body?.full_name ?? "").trim().slice(0, 150) || null;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 255) return fail(set, 400, "Masukkan email yang valid.");
      if (password.length < 8 || password.length > 256) return fail(set, 400, "Password harus 8–256 karakter.");
      try {
        const user = await store.register(email, hashPassword(password), fullName);
        set.status = 201;
        return { user: safeUser(user) };
      } catch (e) {
        if (e.code === "23505") return fail(set, 409, "Email sudah terdaftar.");
        throw e;
      }
    })
    .post("/auth/login", async ({ body, set }) => {
      const email = String(body?.email ?? "").trim().toLowerCase();
      const password = String(body?.password ?? "");
      if (password.length > 256) return fail(set, 400, "Email atau password salah.");
      const user = await store.userByEmail(email);
      if (!user || !verifyPassword(password, user.password_hash)) return fail(set, 401, "Email atau password salah.");
      if (!user.is_active) return fail(set, 403, "Akun dinonaktifkan.");
      const token = randomBytes(32).toString("hex");
      await store.login(token, user.id);
      return { token, user: safeUser(user) };
    })
    .get("/auth/me", async ({ request, set }) => {
      const user = await currentUser(request);
      return user ? { user: safeUser(user) } : fail(set, 401, "Silakan masuk terlebih dahulu.");
    })
    .post("/auth/logout", async ({ request }) => { await store.logout(tokenOf(request)); return { ok: true }; })
    .post("/submit-laporan", async ({ request, body, set }) => {
      const user = await currentUser(request);
      if (!user) return fail(set, 401, "Silakan masuk untuk mengirim laporan.");
      const raw = String(body?.description_raw ?? "").trim();
      if (raw.length < 10 || raw.length > 12000) return fail(set, 400, "Isi laporan harus 10–12.000 karakter.");
      const image = body?.image_url ?? null;
      if (image && !/^\/uploads\/laporkuy\/[a-f0-9]{32}\.(png|jpg|webp)$/.test(image)) return fail(set, 400, "Alamat foto tidak valid.");
      const report = await store.createReport({
        ticket_number: `LPK-${randomBytes(8).toString("hex").toUpperCase()}`,
        user_id: user.id, description_raw: raw, image_url: image, is_public: body?.is_public === true,
      });
      set.status = 201;
      return { report };
    })
    .post("/upload-image", async ({ request, set }) => {
      if (!(await currentUser(request))) return fail(set, 401, "Silakan masuk untuk mengunggah foto.");
      const form = await request.formData().catch(() => null);
      const file = form?.get("file");
      if (!(file instanceof File)) return fail(set, 400, "Pilih foto terlebih dahulu.");
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return fail(set, 400, "Gunakan foto PNG, JPG, atau WebP.");
      if (!file.size || file.size > 5 * 1024 * 1024) return fail(set, 400, "Ukuran foto harus 1 byte sampai 5 MB.");
      const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
      const signatureOK = file.type === "image/png" ? [137,80,78,71,13,10,26,10].every((b,i) => bytes[i] === b)
        : file.type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP";
      if (!signatureOK) return fail(set, 400, "Isi berkas bukan gambar yang valid.");
      set.status = 201;
      return { image_url: await saveImage(file, demo) };
    }, { parse: "none" })
    .get("/log", async ({ request, set }) => {
      const user = await currentUser(request);
      if (!user) return fail(set, 401, "Silakan masuk untuk melihat riwayat.");
      return { data: (await store.list()).filter(r => r.user_id === user.id) };
    })
    .get("/reports", async ({ query }) => {
      const q = String(query.q ?? "").toLowerCase().trim();
      const data = (await store.list()).filter(visible).map(publicReport).filter(r =>
        (!query.status || r.status === query.status) &&
        (!q || [r.title,r.location,r.description,r.ticket_number,r.dinas_name].some(s => String(s ?? "").toLowerCase().includes(q)))
      );
      const page = Math.max(1, Math.floor(Number(query.page) || 1));
      return { data: data.slice((page - 1) * 12, page * 12), total: data.length, page };
    })
    .get("/reports/:ticket", async ({ params, set }) => {
      const row = await store.ticket(params.ticket.toUpperCase());
      return row && visible(row) ? { report: publicReport(row) } : fail(set, 404, "Laporan publik tidak ditemukan.");
    })
    .get("/track/:ticket", async ({ request, params, set }) => {
      const user = await currentUser(request);
      if (!user) return fail(set, 401, "Masuk untuk melacak laporan milikmu.");
      const row = await store.ticket(params.ticket.toUpperCase());
      if (!row || (row.user_id !== user.id && !canManage(user, row))) return fail(set, 404, "Tiket tidak ditemukan pada akunmu.");
      return { report: row, history: await store.history(row.id) };
    })
    .get("/chat-stats", async () => {
      const rows = (await store.list()).filter(visible);
      return { data: [
        { name: "Resolved", value: rows.filter(r => r.status === "resolved").length },
        { name: "Active", value: rows.filter(r => ["accepted","in_progress"].includes(r.status)).length },
        { name: "Waiting", value: rows.filter(r => ["submitted","needs_review"].includes(r.status)).length },
        { name: "Escalated", value: rows.filter(r => r.status === "routed").length },
      ] };
    })
    .get("/government/reports", async ({ request, query, set }) => {
      const user = await currentUser(request);
      if (!user) return fail(set, 401, "Silakan masuk terlebih dahulu.");
      if (!["admin","pemerintah"].includes(user.role)) return fail(set, 403, "Halaman ini khusus petugas pemerintah.");
      const all = (await store.list()).filter(r => canManage(user,r));
      const q = String(query.q ?? "").toLowerCase().trim();
      const data = all.filter(r => (!query.status || r.status === query.status) &&
        (!q || `${r.description_raw} ${r.ticket_number}`.toLowerCase().includes(q)));
      const page = Math.max(1, Math.floor(Number(query.page) || 1));
      return { data: data.slice((page - 1) * 12, page * 12), total: data.length, page,
        summary: { total: all.length, waiting: all.filter(r => ["submitted","needs_review","routed"].includes(r.status)).length,
          active: all.filter(r => ["accepted","in_progress"].includes(r.status)).length,
          resolved: all.filter(r => r.status === "resolved").length } };
    })
    .get("/government/dinas", async ({ request, set }) => {
      const user = await currentUser(request);
      return ["admin","pemerintah"].includes(user?.role) ? { data: await store.dinas() } : fail(set, user ? 403 : 401, "Akses petugas diperlukan.");
    })
    .get("/government/reports/:id", async ({ request, params, set }) => {
      const user = await currentUser(request);
      if (!user) return fail(set, 401, "Silakan masuk terlebih dahulu.");
      if (!UUID.test(params.id)) return fail(set,404,"Laporan tidak ditemukan.");
      const row = await store.get(params.id);
      if (!row || !canManage(user,row)) return fail(set,404,"Laporan tidak ditemukan atau bukan kewenangan dinasmu.");
      return { report: row, history: await store.history(row.id) };
    })
    .patch("/government/reports/:id", async ({ request, params, body, set }) => {
      const user = await currentUser(request);
      if (!user) return fail(set, 401, "Silakan masuk terlebih dahulu.");
      if (!UUID.test(params.id)) return fail(set,404,"Laporan tidak ditemukan.");
      const row = await store.get(params.id);
      if (!row || !canManage(user,row)) return fail(set,404,"Laporan tidak ditemukan atau bukan kewenangan dinasmu.");
      const validation = validateUpdate(body,row,user);
      if (validation) return fail(set,400,validation);
      if (!body.expected_updated_at || !Number.isFinite(Date.parse(body.expected_updated_at))) return fail(set,400,"Muat ulang detail laporan sebelum menyimpan.");
      const dinasId = user.role === "admin" ? body.dinas_id || null : row.dinas_id;
      if (dinasId && !(await store.dinas()).some(d => d.id === dinasId)) return fail(set,400,"Dinas tidak valid.");
      if (body.status === "routed" && !dinasId) return fail(set,400,"Pilih dinas tujuan sebelum meneruskan laporan.");
      if (body.moderation_status && !["pending","published","held"].includes(body.moderation_status)) return fail(set,400,"Status publikasi tidak valid.");
      const admin = user.role === "admin";
      const input = {
        status: body.status, progress_percent: Number(body.progress_percent), note: String(body.note).trim(), dinas_id: dinasId,
        moderation_status: admin ? body.moderation_status ?? row.moderation_status : row.moderation_status,
        public_title: admin ? String(body.public_title ?? row.public_title ?? "").trim().slice(0,200) : row.public_title,
        public_location: admin ? String(body.public_location ?? row.public_location ?? "").trim().slice(0,500) : row.public_location,
        description_redacted: admin ? String(body.description_redacted ?? row.description_redacted ?? "").trim().slice(0,12000) : row.description_redacted,
      };
      const updated = await store.update(row.id,input,user,body.expected_updated_at);
      if (!updated) return fail(set,409,"Laporan baru saja diperbarui petugas lain. Muat ulang detail sebelum menyimpan.");
      return { report: await store.get(row.id), history: await store.history(row.id) };
    });
}
