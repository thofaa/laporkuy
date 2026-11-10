import { describe, expect, test } from "bun:test";
import { redactPII, evaluateReport } from "../src/server/jev-routing.ts";

const MAPPING = {
  infrastruktur_jalan: ["dinas-pupr"],
  persampahan: ["dinas-lingkungan-hidup"],
  air_limbah: ["dinas-pupr", "dinas-lingkungan-hidup"],
  transportasi: ["dinas-perhubungan"],
  pendidikan_kebudayaan: ["dinas-pendidikan-kebudayaan"],
};

describe("redactPII", () => {
  test("mengganti telepon, email, dan alamat dengan placeholder", () => {
    const out = redactPII("Hubungi 081234567890 atau budi@mail.com di Jalan Merdeka No 5, Malang");
    expect(out).toContain("[TELEPON]");
    expect(out).toContain("[EMAIL]");
    expect(out).toContain("[ALAMAT]");
    expect(out).not.toContain("081234567890");
    expect(out).not.toContain("budi@mail.com");
  });
  test("menghapus baris Lokasi:", () => {
    expect(redactPII("Judul\nLokasi: Jl. Soekarno Hatta\n\nLubang jalan")).not.toContain("Lokasi:");
  });
});

describe("evaluateReport", () => {
  const ok = {
    kategori: { choice: "persampahan", confidence: 0.95 },
    kategori_cocok: { noul: 0.9 },
    dinas: { choice: "dinas-lingkungan-hidup", confidence: 0.95, probabilities: { "dinas-lingkungan-hidup": 0.95, "dinas-pupr": 0.05 } },
    urgensi: { choice: "sedang" },
    toxic: { noul: 0.02 },
    threat: { noul: 0.01 },
  };
  test("jawaban yakin dan cocok mapping -> route (tanpa review)", () => {
    const e = evaluateReport(ok, MAPPING);
    expect(e.needsReview).toBe(false);
    expect(e.dinas).toBe("dinas-lingkungan-hidup");
  });
  test("kategori_cocok di bawah ambang Noul -> needs_review", () => {
    const e = evaluateReport({ ...ok, kategori_cocok: { noul: 0.5 } }, MAPPING);
    expect(e.needsReview).toBe(true);
    expect(e.reasons).toContain("kategori_cocok_bawah_0.7");
  });
  test("kategori lainnya -> needs_review", () => {
    const e = evaluateReport({ ...ok, kategori: { choice: "lainnya", confidence: 0.9 } }, MAPPING);
    expect(e.needsReview).toBe(true);
    expect(e.reasons).toContain("kategori_lainnya");
  });
  test("kategori tanpa mapping -> needs_review", () => {
    const e = evaluateReport({ ...ok, kategori: { choice: "kesehatan", confidence: 0.9 } }, MAPPING);
    expect(e.needsReview).toBe(true);
    expect(e.reasons).toContain("kategori_tanpa_mapping");
  });
  test("top probabilitas dinas di bawah ambang -> needs_review", () => {
    const e = evaluateReport({ ...ok, dinas: { choice: "dinas-pupr", confidence: 0.34, probabilities: { "dinas-pupr": 0.34, "dinas-lingkungan-hidup": 0.33, "dinas-perhubungan": 0.33 } } }, MAPPING);
    expect(e.needsReview).toBe(true);
    expect(e.reasons).toContain("dinas_top_bawah");
  });
  test("dinasp berwenang (mapped) probabilitas rendah -> needs_review", () => {
    const e = evaluateReport({ ...ok, dinas: { choice: "dinas-pupr", confidence: 0.7, probabilities: { "dinas-pupr": 0.7, "dinas-lingkungan-hidup": 0.2 } } }, MAPPING);
    expect(e.needsReview).toBe(true);
    expect(e.reasons).toContain("dinas_mapped_bawah");
  });
  test("koreksi: pilihan teratas bukan dinas berwenang, tapi dinas mapped punya prob cukup -> dirutekan", () => {
    const e = evaluateReport({ ...ok, dinas: { choice: "dinas-pupr", confidence: 0.55, probabilities: { "dinas-pupr": 0.55, "dinas-lingkungan-hidup": 0.45 } } }, MAPPING);
    expect(e.needsReview).toBe(false);
    expect(e.dinas).toBe("dinas-lingkungan-hidup");
    expect(e.dinasProb).toBeCloseTo(0.45);
  });
  test("kalibrasi Noul 0.55: kategori_cocok 0.69 pada laporan jelas tetap dirutekan", () => {
    const e = evaluateReport({ ...ok, kategori_cocok: { noul: 0.69 } }, MAPPING);
    expect(e.needsReview).toBe(false);
  });
});