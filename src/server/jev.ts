import { OpenRouter } from "@openrouter/sdk";
import type { DecisionsRequest } from "@openrouter/sdk/esm/models/decisionsrequest.js";
import type { DecisionsResponse } from "@openrouter/sdk/esm/models/decisionsresponse.js";

export interface JevConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface JevReportInput {
  ticket_number: string;
  description_redacted: string;
  lokasi?: { kecamatan?: string; kelurahan?: string } | null;
  kanal?: string;
}

export function jevConfig(env: Record<string, string | undefined> = Bun.env): JevConfig {
  const apiKey = env.JEV_API_KEY;
  const baseUrl = env.JEV_BASE_URL;
  if (!apiKey) throw new Error("JEV_API_KEY tidak diatur di environment.");
  if (!baseUrl) throw new Error("JEV_BASE_URL tidak diatur di environment.");
  return { apiKey, baseUrl, model: env.JEV_MODEL ?? "typesafe/jev-1.13" };
}

export function buildJevRequest(report: JevReportInput, model: string): DecisionsRequest {
  return {
    model,
    state: {
      laporan: report.description_redacted,
      lokasi: report.lokasi ?? {},
      kanal: report.kanal ?? "web",
    },
    questions: {
      kategori: {
        type: "choice",
        instructions: "Pilih satu kategori yang paling tepat untuk isi `laporan`.",
        criteria: {
          infrastruktur_jalan: { cakupan: "Jalan rusak, berlubang, amblas, trotoar, jembatan, drainase jalan", contoh: ["lubang besar di Jl. Soekarno Hatta", "aspal ambles", "trotoar hancur"] },
          persampahan: { cakupan: "Sampah menumpuk, TPS liar, pengangkutan tidak jalan", contoh: ["sampah numpuk di pinggir jalan", "TPS tidak diangkut seminggu"] },
          penerangan_jalan: { cakupan: "Lampu PJU mati, kabel membahayakan", contoh: ["lampu jalan mati sejak lama", "kabel PJU putus"] },
          air_limbah: { cakupan: "Saluran air tersumbat, banjir, limbah", contoh: ["selokan mampet bikin banjir", "limbah pabrik dibuang ke sungai"] },
          transportasi: { cakupan: "Angkutan umum, parkir liar, terminal", contoh: ["angkot tidak mau masuk", "parkir liar di trotoar"] },
          kesehatan: { cakupan: "Fasilitas kesehatan, obat, layanan puskesmas", contoh: ["puskesmas tutup jam kerja", "obat kosong"] },
          pendidikan_kebudayaan: { cakupan: "Sekolah, fasilitas pendidikan, kegiatan kebudayaan", contoh: ["sekolah rusak", "perpustakaan tutup", "kegiatan kesenian daerah"] },
          lainnya: { cakupan: "Tidak cocok dengan kategori mana pun", contoh: ["pohon tumbang", "hewan liar"] },
        },
      },
      kategori_cocok: {
        type: "noul",
        instructions: "Apakah isi `laporan` benar-benar cocok dengan salah satu kategori yang tersedia, selain `lainnya`?",
      },
      dinas: {
        type: "choice",
        instructions: "Pilih dinas yang berwenang menangani `laporan` di `lokasi`. Pilih berdasarkan kewenangan, bukan kemiripan nama.",
        criteria: {
          "dinas-pupr": { kewenangan: "Jalan kota, drainase, jembatan", bukan_untuk: "Jalan provinsi/nasional, sampah, PJU" },
          "dinas-lingkungan-hidup": { kewenangan: "Persampahan, TPS, pengelolaan limbah", bukan_untuk: "Jalan rusak, drainase" },
          "dinas-perhubungan": { kewenangan: "Angkutan umum, parkir, terminal", bukan_untuk: "Jalan berlubang" },
          "dinas-pendidikan-kebudayaan": { kewenangan: "Sekolah, fasilitas pendidikan, sanggar, kegiatan budaya", bukan_untuk: "Jalan rusak, sampah" },
        },
      },
      urgensi: {
        type: "choice",
        instructions: "Seberapa mendesak laporan ini ditangani?",
        criteria: {
          rendah: "Tidak mengganggu aktivitas, bisa ditunda",
          sedang: "Mengganggu sebagian warga, perlu dalam minggu ini",
          tinggi: "Membahayakan atau mengganggu banyak orang, perlu hari ini",
          darurat: "Ancaman nyawa atau keselamatan langsung",
        },
      },
      toxic: {
        type: "noul",
        instructions: "Apakah `laporan` berisi umpatan, ujaran kebencian, atau serangan personal?",
        criteria: { true: "Umpatan, slur, hinaan, atau serangan ke orang/kelompok", false: "Keluhan biasa, netral, atau marah tanpa menyerang" },
      },
      threat: {
        type: "noul",
        instructions: "Apakah `laporan` berisi ancaman kekerasan atau teror?",
      },
    },
  };
}

export async function jevDecision(
  report: JevReportInput,
  config: JevConfig = jevConfig(),
): Promise<DecisionsResponse> {
  const openrouter = new OpenRouter({ apiKey: config.apiKey, serverURL: config.baseUrl });
  return openrouter.alpha.decisions.create({
    decisionsRequest: buildJevRequest(report, config.model),
  });
}