import { describe, test, expect, beforeAll } from "bun:test";
import { createApi } from "../src/server/api.js";
import { createDemoStore } from "../src/server/demo-store.js";
import { publicReport, parseReport } from "../src/shared/reports.js";

const store=createDemoStore();
const app=createApi({ demo:true, store });
async function request(path,{ token,method="GET",body }={}) {
  const res=await app.handle(new Request(`http://localhost/api${path}`,{
    method, headers:{ ...(token ? { Authorization:`Bearer ${token}` } : {}), ...(body ? { "Content-Type":"application/json" } : {}) }, body:body ? JSON.stringify(body) : undefined,
  }));
  return { status:res.status, json:await res.json() };
}
let user,admin,petugas;
beforeAll(async () => {
  user=(await request("/auth/login",{method:"POST",body:{email:"warga@demo.test",password:"WargaDemo123!"}})).json.token;
  admin=(await request("/auth/login",{method:"POST",body:{email:"admin@demo.test",password:"AdminDemo123!"}})).json.token;
  petugas=(await request("/auth/login",{method:"POST",body:{email:"petugas@demo.test",password:"PetugasDemo123!"}})).json.token;
  expect(user).toBeTruthy(); expect(admin).toBeTruthy(); expect(petugas).toBeTruthy();
});
describe("Autentikasi dan pembatasan akses",() => {
  test("laporan pribadi dan dashboard menolak tanpa sesi",async () => {
    expect((await request("/log")).status).toBe(401);
    expect((await request("/government/reports")).status).toBe(401);
    expect((await request("/submit-laporan",{method:"POST",body:{description_raw:"contoh laporan"}})).status).toBe(401);
    expect((await request("/government/reports",{token:user})).status).toBe(403);
  });
  test("registrasi tidak dapat memberi dirinya role admin",async () => {
    const r=await request("/auth/register",{method:"POST",body:{email:"baru@demo.test",password:"Password123!",role:"admin"}});
    expect(r.status).toBe(201); expect(r.json.user.role).toBe("user");
    expect((await request("/auth/register",{method:"POST",body:{email:"baru@demo.test",password:"Password123!"}})).status).toBe(409);
  });
  test("petugas hanya menerima laporan untuk dinasnya",async () => {
    const all=await request("/government/reports",{token:admin});
    const own=await request("/government/reports",{token:petugas});
    expect(own.json.data.length).toBe(1);
    const other=all.json.data.find(r => r.dinas_id && r.dinas_id!==own.json.data[0].dinas_id);
    expect((await request(`/government/reports/${other.id}`,{token:petugas})).status).toBe(404);
    expect((await request("/government/reports/not-an-id",{token:admin})).status).toBe(404);
  });
});
describe("Pelaporan, tanggapan, dan publikasi",() => {
  test("raw data dan identitas tidak masuk respons publik",async () => {
    const r=await request("/reports");
    expect(r.json.total).toBe(3);
    for(const row of r.json.data) {
      expect(row).not.toHaveProperty("user_id"); expect(row).not.toHaveProperty("description_raw"); expect(row).not.toHaveProperty("image_url");
    }
    expect((await request("/reports/LPK-DEMO0004")).status).toBe(404);
    expect(publicReport({ public_title:"Judul",description_raw:"RAHASIA",contact_email:"private@test" })).not.toHaveProperty("contact_email");
  });
  test("simpan laporan, beri tanggapan, lacak dan terbitkan ringkasan",async () => {
    const created=await request("/submit-laporan",{token:user,method:"POST",body:{description_raw:"Uji jalan berlubang\nLokasi: Malang\n\nJalan perlu diperbaiki.",is_public:true}});
    expect(created.status).toBe(201);
    const r=created.json.report;
    expect((await request(`/reports/${r.ticket_number}`)).status).toBe(404);
    const update={status:"in_progress",progress_percent:50,note:"Petugas telah memeriksa jalan.",expected_updated_at:r.updated_at || r.submitted_at,moderation_status:"published",public_title:"Jalan berlubang",public_location:"Malang",description_redacted:"Perbaikan jalan sedang ditangani."};
    const saved=await request(`/government/reports/${r.id}`,{token:admin,method:"PATCH",body:update});
    expect(saved.status).toBe(200);
    expect(saved.json.report.progress_percent).toBe(50);
    expect((await request(`/reports/${r.ticket_number}`)).json.report.description).toBe(update.description_redacted);
    const tracked=await request(`/track/${r.ticket_number}`,{token:user});
    expect(tracked.json.history.at(-1).note).toBe(update.note);
    expect(tracked.json.history.length).toBe(2);
    expect((await request(`/track/${r.ticket_number}`)).status).toBe(401);
    const stranger=(await request("/auth/login",{method:"POST",body:{email:"baru@demo.test",password:"Password123!"}})).json.token;
    expect((await request(`/track/${r.ticket_number}`,{token:stranger})).status).toBe(404);
    expect((await request(`/government/reports/${r.id}`,{token:admin,method:"PATCH",body:update})).status).toBe(409);
  });
  test("laporan tanpa persetujuan tidak bisa dipublikasikan",async () => {
    const r=(await request("/track/LPK-DEMO0004",{token:user})).json.report;
    const out=await request(`/government/reports/${r.id}`,{token:admin,method:"PATCH",body:{status:"accepted",progress_percent:10,note:"Ditinjau",moderation_status:"published",public_title:"Judul",description_redacted:"Deskripsi publik",expected_updated_at:r.updated_at}});
    expect(out.status).toBe(400);
  });
  test("progres selesai harus 100 dan unggahan URL asing ditolak",async () => {
    const r=(await request("/track/LPK-DEMO0001",{token:user})).json.report;
    expect((await request(`/government/reports/${r.id}`,{token:admin,method:"PATCH",body:{status:"resolved",progress_percent:50,note:"Selesai",expected_updated_at:r.updated_at}})).status).toBe(400);
    expect((await request("/submit-laporan",{token:user,method:"POST",body:{description_raw:"Laporan uji berkas dari sumber lain",image_url:"https://evil.test/foto.png"}})).status).toBe(400);
  });
  test("filter kata kunci dan status memotong hasil",async () => {
    const r=await request("/reports?q=sampah&status=resolved");
    expect(r.json.total).toBe(1); expect(r.json.data[0].ticket_number).toBe("LPK-DEMO0002");
    expect((await request("/reports?q=tidak-ada-sama-sekali")).json.total).toBe(0);
  });
  test("pengurai data lama tetap kompatibel",() => {
    expect(parseReport("Judul\nLokasi: Malang\n\nUraian")).toEqual({title:"Judul",location:"Malang",description:"Uraian"});
  });
});
test("logout membatalkan token",async () => {
  const token=(await request("/auth/login",{method:"POST",body:{email:"warga@demo.test",password:"WargaDemo123!"}})).json.token;
  await request("/auth/logout",{method:"POST",token});
  expect((await request("/auth/me",{token})).status).toBe(401);
});
