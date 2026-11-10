// Queue Redis sederhana (LPUSH/BRPOP) memakai client Redis bawaan Bun.
// Cukup untuk worker tunggal; ganti ke queue berfitur (BullMQ) bila butuh
// prioritas, visibility timeout, atau multiple worker.
let client = null;

function redis() {
  if (!client) {
    client = new Bun.RedisClient(Bun.env.REDIS_URL ?? "redis://localhost:6379");
  }
  return client;
}

const QUEUE = "jev:queue";
const RETRIES = "jev:retries";

export function enqueueJob(reportId) {
  return redis().lpush(QUEUE, reportId);
}

export async function dequeueJob(timeout = 5) {
  const item = await redis().brpop(QUEUE, timeout);
  return item ? item[1] : null;
}

export async function attempts(reportId) {
  return Number(await redis().hget(RETRIES, reportId) ?? 0);
}

export async function markAttempt(reportId) {
  return redis().hincrby(RETRIES, reportId, 1);
}

export async function clearAttempt(reportId) {
  return redis().hdel(RETRIES, reportId);
}