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
  const decorate = (row) => row && { ...row, dinas_name: dinas.find(d => d.id === row.dinas_id)?.name ?? null };
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
