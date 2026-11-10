import { randomUUID } from "node:crypto";
import { hashPassword } from "./auth.js";

export function createDemoStore() {
  const dinas = [
    { id: randomUUID(), slug: "pu", name: "Dinas Pekerjaan Umum" },
    { id: randomUUID(), slug: "lingkungan", name: "Dinas Lingkungan Hidup" },
    { id: randomUUID(), slug: "perhubungan", name: "Dinas Perhubungan" },
  ];
  const users = [
    { id: randomUUID(), email: "warga@demo.test", password_hash: hashPassword("WargaDemo123!"), role: "user", is_active: true },
    { id: randomUUID(), email: "admin@demo.test", password_hash: hashPassword("AdminDemo123!"), role: "admin", is_active: true },
    { id: randomUUID(), email: "petugas@demo.test", password_hash: hashPassword("PetugasDemo123!"), role: "pemerintah", dinas_id: dinas[0].id, is_active: true },
  ];
  const sessions = new Map();
  const reports = new Map();
  const histories = new Map();
  const feedbacks = new Map();
  const reroutes = new Map();
  const faq = new Map();
  const examples = [
    ["LPK-DEMO0001", "Jalan berlubang di Soekarno Hatta", "Lowokwaru, Kota Malang", "Lubang di badan jalan membahayakan pengendara saat hujan.", "in_progress", 45, 0],
    ["LPK-DEMO0002", "Sampah menumpuk di sekitar TPS", "Klojen, Kota Malang", "Pengangkutan sampah perlu ditingkatkan agar akses warga kembali bersih.", "resolved", 100, 1],
    ["LPK-DEMO0003", "Lampu jalan tidak menyala", "Blimbing, Kota Malang", "Lampu penerangan padam sehingga pengguna jalan kesulitan pada malam hari.", "accepted", 15, 2],
    ["LPK-DEMO0004", "Masukan untuk jadwal layanan warga", "Kantor layanan kecamatan", "Usulan agar jadwal pelayanan dipublikasikan lebih jelas.", "submitted", 0, null],
  ];
  examples.forEach(([ticket, title, location, description, status, progress, dinasIndex], index) => {
    const id = randomUUID();
    const date = new Date(Date.now() - (4 - index) * 86400000).toISOString();
    reports.set(id, {
      id, ticket_number: ticket, user_id: users[0].id,
      description_raw: `${title}\nLokasi: ${location}\n\n${description}`,
      image_url: null, status, progress_percent: progress,
      dinas_id: dinasIndex === null ? null : dinas[dinasIndex].id,
      is_public: index < 3, moderation_status: index < 3 ? "published" : "pending",
      public_title: title, public_location: location, description_redacted: description,
      urgency: "sedang", submitted_at: date, updated_at: date,
    });
    histories.set(id, [{ id: randomUUID(), to_status: "submitted", note: "Laporan diterima oleh sistem.", progress_percent: 0, created_at: date }]);
    if (status !== "submitted") histories.get(id).push({ id: randomUUID(), to_status: status, note: status === "resolved" ? "Penanganan selesai dan sudah diperiksa petugas." : "Petugas sudah memeriksa laporan dan menyiapkan penanganan.", progress_percent: progress, created_at: new Date().toISOString() });
  });
  const addFeedbackSync = (reportId, user, message, at) => {
    if (!feedbacks.has(reportId)) feedbacks.set(reportId, []);
    feedbacks.get(reportId).push({ id: randomUUID(), sender_id: user.id, message, sender_name: user.full_name ?? null, sender_role: user.role, created_at: at });
  };
  const decorate = (row) => row && { ...row, dinas_name: dinas.find(d => d.id === row.dinas_id)?.name ?? null, pending_routing: pendingOf(row.id) };
  const pendingOf = (id) => {
    const r = reroutes.get(id);
    if (!r || r.status !== "pending") return null;
    const target = dinas.find(d => d.id === r.requested_dinas_id);
    return { id: r.request_id, requested_dinas_id: r.requested_dinas_id, requested_dinas_name: target?.name ?? null,
      requested_by: r.requested_by, previous_status: r.previous_status, note: r.note, created_at: r.created_at };
  };
  return {
    async userByEmail(email) { return users.find(u => u.email === email); },
    async register(email, password_hash, full_name) {
      if (users.some(u => u.email === email)) throw Object.assign(new Error("duplicate"), { code: "23505" });
      const row = { id: randomUUID(), email, password_hash, full_name, role: "user", is_active: true };
      users.push(row); return row;
    },
    async session(token) { const s = sessions.get(token); return s && s.expires > Date.now() ? users.find(u => u.id === s.user_id && u.is_active) : null; },
    async login(token, user_id) { sessions.set(token, { user_id, expires: Date.now() + 7 * 86400000 }); },
    async logout(token) { sessions.delete(token); },
    async createReport(input) {
      const row = { ...input, id: randomUUID(), status: "submitted", progress_percent: 0, moderation_status: "pending", dinas_id: null, submitted_at: new Date().toISOString() };
      reports.set(row.id, row);
      histories.set(row.id, [{ id: randomUUID(), to_status: "submitted", note: "Laporan diterima oleh sistem.", progress_percent: 0, created_at: row.submitted_at }]);
      return decorate(row);
    },
    async list() { return [...reports.values()].map(decorate).sort((a,b) => b.submitted_at.localeCompare(a.submitted_at)); },
    async get(id) { return decorate(reports.get(id)); },
    async ticket(ticket) { return decorate([...reports.values()].find(r => r.ticket_number === ticket)); },
    async history(id) { return histories.get(id) ?? []; },
    async feedbacks(reportId, userId) {
      return (feedbacks.get(reportId) ?? []).map(f => ({ ...f, mine: f.sender_id === userId }));
    },
    async addFeedback(reportId, user, message) {
      const row = { id: randomUUID(), sender_id: user.id, message, sender_name: user.full_name ?? null, sender_role: user.role, created_at: new Date().toISOString() };
      if (!feedbacks.has(reportId)) feedbacks.set(reportId, []);
      feedbacks.get(reportId).push(row);
      return row;
    },
    async dinas() { return dinas; },
    async askFaqQuestion(userId, question) {
      const row = { id: randomUUID(), user_id: userId, question, answer: null, answered_by: null, answered_at: null, status: "open", created_at: new Date().toISOString() };
      if (!faq.has(userId)) faq.set(userId, []);
      faq.get(userId).push(row);
      return row;
    },
    async faqQuestionsByUser(userId) { return faq.get(userId) ?? []; },
    async faqQuestions(status) {
      const all = [...faq.values()].flat();
      const rows = all.map(q => ({ ...q, user_name: users.find(u => u.id === q.user_id)?.full_name ?? null }));
      return status ? rows.filter(q => q.status === status) : rows;
    },
    async answerFaqQuestion(id, adminId, answer) {
      for (const list of faq.values()) {
        const q = list.find(x => x.id === id);
        if (q) { q.answer = answer; q.answered_by = adminId; q.answered_at = new Date().toISOString(); q.status = "answered"; return q; }
      }
      return null;
    },
    async pendingRoutingRequest(reportId) { return pendingOf(reportId); },
    async requestReroute(reportId, user, dinasId, note) {
      const row = reports.get(reportId);
      if (!row) return null;
      const existing = reroutes.get(reportId);
      if (existing?.status === "pending") return { error: "already_pending" };
      const target = dinas.find(d => d.id === dinasId);
      if (!target) return { error: "invalid_dinas" };
      const at = new Date().toISOString();
      const requestId = randomUUID();
      reroutes.set(reportId, { request_id: requestId, requested_dinas_id: dinasId, requested_by: user.id, previous_status: row.status, note, status: "pending", created_at: at });
      const fromStatus = row.status;
      row.status = "needs_review"; row.updated_at = at;
      const message = note ? `Permintaan perutean ke ${target.name}. ${note}` : `Meminta perutean ke ${target.name}.`;
      histories.get(reportId).push({ id: randomUUID(), from_status: fromStatus, to_status: "needs_review", actor_id: user.id, actor_type: "user", note: message, progress_percent: 0, created_at: at });
      addFeedbackSync(reportId, user, message, at);
      return { ok: true };
    },
    async decideReroute(reportId, requestId, admin, decision, note) {
      const r = reroutes.get(reportId);
      if (!r || r.request_id !== requestId || r.status !== "pending") return { error: "no_pending" };
      const row = reports.get(reportId);
      if (!row) return { error: "not_found" };
      const target = dinas.find(d => d.id === r.requested_dinas_id);
      const fromStatus = row.status;
      const at = new Date().toISOString();
      const message = note ? `${decision === "approve" ? "Perutean ke " : "Permintaan perutean ke "}${target?.name ?? "dinas tujuan"} ${decision === "approve" ? "disetujui admin." : "ditolak admin."} ${note}` : `${decision === "approve" ? "Perutean ke " : "Permintaan perutean ke "}${target?.name ?? "dinas tujuan"} ${decision === "approve" ? "disetujui admin." : "ditolak admin."}`;
      if (decision === "approve") {
        r.status = "approved"; row.dinas_id = r.requested_dinas_id; row.status = "routed"; row.routed_at = at;
      } else {
        r.status = "rejected"; row.status = r.previous_status;
      }
      row.updated_at = at;
      histories.get(reportId).push({ id: randomUUID(), from_status: fromStatus, to_status: row.status, actor_id: admin.id, actor_type: "admin", note: message, progress_percent: row.progress_percent ?? 0, created_at: at });
      addFeedbackSync(reportId, admin, message, at);
      return { report: decorate(row), previousStatus: r.previous_status };
    },
    async assignDinas(id, dinasId, adminId) {
      const row = reports.get(id);
      if (!row) return null;
      const newStatus = row.status === "needs_review" && dinasId ? "routed" : row.status;
      row.dinas_id = dinasId; row.status = newStatus;
      const at = new Date().toISOString();
      histories.get(id).push({ id: randomUUID(), from_status: row.status, to_status: newStatus, actor_id: adminId, actor_type: "admin", note: "Admin menetapkan dinas tujuan; laporan dirutekan.", progress_percent: 0, created_at: at });
      return decorate(row);
    },
    async update(id, input, actor, expected) {
      const row = reports.get(id);
      if (!row || (row.updated_at ?? row.submitted_at) !== expected) return null;
      const event = { id: randomUUID(), from_status: row.status, to_status: input.status, note: input.note, progress_percent: input.progress_percent, created_at: new Date(Math.max(Date.now(), Date.parse(row.updated_at ?? row.submitted_at) + 1)).toISOString() };
      const resolved = input.status === "resolved";
      Object.assign(row, input, { updated_at: event.created_at,
        resolved_at: resolved ? event.created_at : null,
        resolution_requested_at: resolved ? event.created_at : null,
        resolution_request_note: resolved ? input.note : null });
      histories.get(id).push(event);
      return decorate(row);
    },
    async respondResolution(id, action, userId) {
      const row = reports.get(id);
      if (!row || row.user_id !== userId) return null;
      if (!row.resolution_requested_at) return { error: "no_request" };
      const at = new Date().toISOString();
      if (action === "approve") {
        row.resolution_requested_at = null; row.resolution_request_note = null; row.updated_at = at;
        histories.get(id).push({ id: randomUUID(), from_status: "resolved", to_status: "resolved", note: "Pelapor menyetujui status selesai.", progress_percent: 100, created_at: at });
        return { report: decorate(row) };
      }
      if (action !== "reject") return { error: "invalid_action" };
      const prev = (histories.get(id) ?? []).filter(h => h.progress_percent < 100).at(-1);
      const progress = prev ? prev.progress_percent : 0;
      Object.assign(row, { status: "in_progress", progress_percent: progress, resolved_at: null,
        resolution_requested_at: null, resolution_request_note: null, updated_at: at });
      histories.get(id).push({ id: randomUUID(), from_status: "resolved", to_status: "in_progress", note: "Pelapor menolak status selesai; laporan dikembalikan untuk ditangani kembali.", progress_percent: progress, created_at: at });
      return { report: decorate(row) };
    },
  };
}
