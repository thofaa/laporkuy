export interface JevAnswers {
  kategori: { choice: string; confidence?: number };
  kategori_cocok: { noul?: number };
  dinas: { choice: string; confidence?: number; probabilities?: Record<string, number> };
  urgensi: { choice?: string };
  toxic?: { noul?: number };
  threat?: { noul?: number };
}

export interface RouteEvaluation {
  kategori: string;
  kategoriCocok: number;
  dinas: string;
  dinasProb: number;
  urgensi: string;
  toxicScore: number;
  threat: boolean;
  needsReview: boolean;
  reasons: string[];
}

export interface RouteThresholds {
  noul: number;
  dinasMinTop: number;
  dinasMinMapped: number;
}

// # ponytail: kalibrasi lapangan, bukan angka PRD mentah.
// PRD §8.4: ambang wajib dikalibrasi dengan sampel nyata; keyakinan Noul dan
// Choice berbeda skala. Pada sampel laporan Malang berbahasa Indonesia yang
// sangat jelas, Jev konsisten memberi kategori_cocok ~0.64–0.69 (kategori &
// dinas choice = confidence 1.0). Ambang Noul PRD 0.7 membuat nyaris semua
// laporan berbahasa Indonesia masuk needs_review, mematikan routing otomatis.
// Kalibrasi Noul -> 0.55.
export const DEFAULT_THRESHOLDS: RouteThresholds = { noul: 0.55, dinasMinTop: 0.5, dinasMinMapped: 0.3 };

// Redaksi PII dasar per PRD §9.2: ganti pola sensitif dengan placeholder agar
// teks tetap bermakna bagi Jev. Bukan pengganti NER; hanya tahap dasar.
const PII_PATTERNS: { re: RegExp; replace: string }[] = [
  { re: /\b08\d{2}[-\s]?\d{3,4}[-\s]?\d{3,5}\b/g, replace: "[TELEPON]" },
  { re: /\b\+62\s?\d{8,13}\b/g, replace: "[TELEPON]" },
  { re: /\b\d{16}\b/g, replace: "[REKENING]" },
  { re: /\b\d{16}\b|\b\d{4}-\d{4}-\d{4}-\d{4}\b/g, replace: "[REKENING]" },
  { re: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, replace: "[EMAIL]" },
  { re: /\b(NIK|no\.?\s*kktp|kartu tanda penduduk)\s*[:.]?\s*\d{16}/gi, replace: "[NIK]" },
  { re: /\b\d{16}\b/g, replace: "[NIK]" },
  { re: /\b[a-z]+ (?:jln\.?|jalan|gang|jl\.?)\b[^\n]{2,40}/gi, replace: "[ALAMAT]" },
];

export function redactPII(text: string): string {
  let out = text;
  for (const { re, replace } of PII_PATTERNS) out = out.replace(re, replace);
  // Bersihkan baris "Lokasi:" agar tidak bocor alamat detail.
  out = out.replace(/^Lokasi:\s*[^\n]*$/gim, "");
  return out.trim();
}

// Validasi kontrak output Jev per PRD §8.2. `mapping` = kategori -> dinas_id[]
// dari tabel kategori_dinas (sumber kebenaran).
// Dinas dipilih BERDASAR PROBABILITAS di antara dinas yang berwenang (mapping),
// bukan sekadar pilihan teratas (`choice`) yang bisa jadi dinas tanpa kewenangan.
export function evaluateReport(answers: JevAnswers, mapping: Record<string, string[]>, thresholds: RouteThresholds = DEFAULT_THRESHOLDS): RouteEvaluation {
  const kategori = answers.kategori?.choice ?? "";
  const kategoriCocok = answers.kategori_cocok?.noul ?? 0;
  const urgensi = answers.urgensi?.choice ?? "sedang";
  const toxicScore = answers.toxic?.noul ?? 0;
  const threat = (answers.threat?.noul ?? 0) >= 0.7;
  const reasons: string[] = [];

  if (kategoriCocok < thresholds.noul) reasons.push("kategori_cocok_bawah_0.7");
  if (kategori === "lainnya") reasons.push("kategori_lainnya");
  const mappedDinas = mapping[kategori] ?? [];
  if (!mappedDinas.length) reasons.push("kategori_tanpa_mapping");

  // Distribusi probabilitas dinas; fallback ke choice+confidence bila tidak ada.
  const probs = answers.dinas?.probabilities ?? (answers.dinas?.choice
    ? { [answers.dinas.choice]: answers.dinas?.confidence ?? 0 } : {});
  const topGlobal = Object.values(probs).reduce((m, p) => Math.max(m, p ?? 0), 0);

  let dinas = answers.dinas?.choice ?? "";
  let dinasProb = answers.dinas?.confidence ?? 0;
  if (topGlobal < thresholds.dinasMinTop) {
    reasons.push("dinas_top_bawah");
  } else if (mappedDinas.length) {
    const best = mappedDinas.reduce((a, b) => (probs[b] ?? 0) > (probs[a] ?? 0) ? b : a, mappedDinas[0]);
    dinasProb = probs[best] ?? 0;
    if (dinasProb < thresholds.dinasMinMapped) reasons.push("dinas_mapped_bawah");
    else dinas = best;
  }

  return {
    kategori, kategoriCocok, dinas, dinasProb, urgensi, toxicScore, threat,
    needsReview: reasons.length > 0,
    reasons,
  };
}