import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = postgres(databaseUrl);

await sql`CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, inserted_at timestamptz DEFAULT now())`;

const migrationsDir = path.join(process.cwd(), "db", "migrations");
const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();

const applied = new Set(
  (await sql`SELECT version FROM schema_migrations`).map((r) => r.version),
);

for (const file of files) {
  const version = file.replace(/\.sql$/, "");
  if (applied.has(version)) continue;
  const content = await readFile(path.join(migrationsDir, file), "utf8");
  await sql.begin(async (tx) => {
    await tx.unsafe(content);
    await tx`INSERT INTO schema_migrations (version) VALUES (${version})`;
  });
  console.log(`migration applied: ${version}`);
}

await sql.end();
