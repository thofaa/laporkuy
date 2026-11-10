import { createPostgresStore } from "./postgres-store.js";
import { jevConfig, jevDecision } from "./jev.ts";
import { redactPII, evaluateReport, DEFAULT_THRESHOLDS } from "./jev-routing.ts";
import { dequeueJob, attempts, markAttempt, clearAttempt, enqueueJob } from "./queue.js";

const numOr = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const thresholds = () => ({
  noul: numOr(Bun.env.JEV_REVIEW_NOUL, DEFAULT_THRESHOLDS.noul),
  dinasMinTop: numOr(Bun.env.JEV_DINAS_MIN_TOP, DEFAULT_THRESHOLDS.dinasMinTop),
  dinasMinMapped: numOr(Bun.env.JEV_DINAS_MIN_MAPPED, DEFAULT_THRESHOLDS.dinasMinMapped),
});

const PII_PLACEHOLDERS = ["NAMA", "TELEPON", "EMAIL", "REKENING", "ALAMAT", "NIK"];

async function processOne(store, config, reportId) {
  const report = await store.get(reportId);
  if (!report || report.status !== "submitted") return;

  const inputRedacted = redactPII(report.description_raw);
  const kategoriList = await store.kategori();
  const dinasList = await store.dinas();
  const mapping = await store.kategoriDinasMapping();
  const modelConfig = await store.activeModelConfig();
  const kategoriOf = Object.fromEntries(kategoriList.map(r => [r.slug, r]));
  const dinasOf = Object.fromEntries(dinasList.map(r => [r.slug, r]));

  const start = Date.now();
  const decision = await jevDecision({
    ticket_number: report.ticket_number,
    description_redacted: inputRedacted,
    lokasi: report.address ? { alamat: report.address } : {},
    kanal: "web",
  }, config);
  const latency = Date.now() - start;

  const ans = decision.answers;
  const e = evaluateReport({
    kategori: ans.kategori,
    kategori_cocok: ans.kategori_cocok,
    dinas: ans.dinas,
    urgensi: ans.urgensi,
    toxic: ans.toxic,
    threat: ans.threat,
  }, mapping, thresholds());

  const piiTypes = PII_PLACEHOLDERS.filter(p => inputRedacted.includes(`[${p}]`));
  const categoryId = kategoriOf[e.kategori]?.id ?? null;
  const dinasId = dinasOf[e.dinas]?.id ?? null;
  const status = e.needsReview ? "needs_review" : "routed";

  await store.routeReport(reportId, {
    status,
    dinas_id: e.needsReview ? null : dinasId,
    category_id: categoryId,
    urgency: e.urgensi,
    description_redacted: inputRedacted,
    input_redacted: inputRedacted,
    input_sent: inputRedacted,
    output_json: { answers: ans, model: decision.model, provider: decision.provider },
    confidence: Math.min(ans.kategori?.confidence ?? 0, e.dinasProb),
    category_confidence: ans.kategori?.confidence ?? 0,
    dinas_confidence: e.dinasProb,
    urgency_confidence: ans.urgensi?.confidence ?? 0,
    pii_types: piiTypes,
    latency_ms: latency,
    token_usage: decision.usage,
    model_config_id: modelConfig?.id ?? null,
  });
  await clearAttempt(reportId);
  console.log(`[jev-worker] ${report.ticket_number} -> ${status} dinas=${e.dinas}(p=${e.dinasProb.toFixed(2)}) reasons=[${e.reasons.join(",")}] (${latency}ms)`);
}

export async function runJevWorker() {
  const store = createPostgresStore();
  const config = jevConfig();
  console.log(`[jev-worker] mulai, model=${config.model}, queue=jev:queue`);
  while (true) {
    const reportId = await dequeueJob();
    if (!reportId) continue;
    try {
      await processOne(store, config, reportId);
    } catch (e) {
      const n = await markAttempt(reportId);
      if (n >= 2) {
        console.error(`[jev-worker] gagal 2x ${reportId}, set needs_review.`, e.message);
        await store.markNeedsReview(reportId, "Gagal diproses AI setelah 2 percobaan; menunggu tinjauan admin.");
        await clearAttempt(reportId);
      } else {
        console.error(`[jev-worker] gagal (retry ${n}) ${reportId}:`, e.message);
        await enqueueJob(reportId);
      }
    }
  }
}