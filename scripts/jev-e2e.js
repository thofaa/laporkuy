// E2E routing Jev: submit laporan -> queue redis -> Jev -> route/needs_review.
// Memakai app yang berjalan (default localhost:3001). Set PORT_APP bila beda.
import postgres from "postgres";

const BASE = process.env.PORT_APP ? `http://localhost:${process.env.PORT_APP}` : "http://localhost:3001";
const sql = postgres(process.env.DATABASE_URL ?? "postgres://laporkuy:laporkuy@localhost:5432/laporkuy");

async function api(path, { token, method = "GET", body } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitRouted(reportId, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const row = await sql`select status, dinas_id from reports where id=${reportId}`;
    if (row[0]?.status !== "submitted") return row[0];
    await wait(1500);
  }
  return (await sql`select status, dinas_id from reports where id=${reportId}`)[0];
}

const email = `warga-e2e-${Date.now()}@test.id`;
const reg = await api("/auth/register", { method: "POST", body: { email, password: "WargaDemo123!", full_name: "Warga E2E" } });
if (reg.status !== 201) { console.error("registrasi gagal", reg.status, reg.json); process.exit(1); }
console.log("warga terdaftar:", email);

const login = await api("/auth/login", { method: "POST", body: { email, password: "WargaDemo123!" } });
const token = login.json.token;

const report = process.argv[2] === "needs-review"
  ? { title: "Puskesmas tutup jam kerja", location: "Kecamatan Klojen", description: "Puskesmas di wilayah Klojen tutup sebelum jam layanan berakhir sehingga warga tidak bisa berobat. Tolong ditinjau jadwal layanannya." }
  : { title: "Sampah menumpuk di sekitar TPS", location: "Kecamatan Lowokwaru", description: "Sampah menumpuk di pinggir jalan dekat TPS sehingga bau dan mengganggu warga. Pengangkutan perlu ditingkatkan." };

const submit = await api("/submit-laporan", { method: "POST", token, body: {
  description_raw: `${report.title}\nLokasi: ${report.location}\n\n${report.description}`,
  is_public: true, lat: -7.98, lng: 112.63, address: report.location,
} });
if (submit.status !== 201) { console.error("submit gagal", submit.status, submit.json); process.exit(1); }
console.log("laporan dikirim, ticket:", submit.json.report.ticket_number, "status langsung:", submit.json.report.status);

const awaited = await waitRouted(submit.json.report.id);
console.log("status setelah worker:", awaited.status, "dinas_id:", awaited.dinas_id);

const cls = await sql`select input_redacted, confidence, dinas_id from ai.classifications where report_id=${submit.json.report.id}`;
if (cls[0]) console.log("classification tersimpan, confidence:", cls[0].confidence, "input_redacted:", cls[0].input_redacted?.slice(0, 80));

await sql.end();