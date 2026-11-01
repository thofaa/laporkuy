import { randomBytes } from "node:crypto";
import { Readable } from "node:stream";
import { Client } from "minio";

const demoImages = new Map();
const BUCKET = "laporkuy";
let client;
function storage() {
  return client ??= new Client({
    endPoint: Bun.env.MINIO_ENDPOINT ?? "localhost",
    port: Number(Bun.env.MINIO_PORT ?? 9000),
    useSSL: Bun.env.MINIO_USE_SSL === "true",
    accessKey: Bun.env.MINIO_ACCESS_KEY ?? "laporkuy",
    secretKey: Bun.env.MINIO_SECRET_KEY ?? "laporkuy123",
  });
}
export async function saveImage(file, demo) {
  const ext = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[file.type];
  const key = `${randomBytes(16).toString("hex")}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  if (demo) {
    if (demoImages.size >= 40) throw new Error("Penyimpanan demo penuh. Mulai ulang server demo.");
    demoImages.set(key, { buffer, type: file.type });
  } else {
    const s = storage();
    if (!(await s.bucketExists(BUCKET))) await s.makeBucket(BUCKET);
    await s.putObject(BUCKET, key, buffer, buffer.length, { "Content-Type": file.type });
  }
  return `/uploads/${BUCKET}/${key}`;
}
export async function readImage(request) {
  const key = new URL(request.url).pathname.match(/^\/uploads\/laporkuy\/([a-f0-9]{32}\.(?:png|jpg|webp))$/)?.[1];
  if (!key) return new Response("Tidak ditemukan", { status: 404 });
  try {
    if (Bun.env.DEMO_MODE === "true") {
      const image = demoImages.get(key);
      return image ? new Response(image.buffer, { headers: { "Content-Type": image.type, "X-Content-Type-Options": "nosniff" } }) : new Response(null, { status: 404 });
    }
    const image = await storage().getObject(BUCKET, key);
    const type = key.endsWith(".png") ? "image/png" : key.endsWith(".jpg") ? "image/jpeg" : "image/webp";
    return new Response(Readable.toWeb(image), { headers: { "Content-Type": type, "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response(null, { status: 404 }); }
}
