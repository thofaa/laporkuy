import postgres from "postgres";
const [slug,name] = process.argv.slice(2);
if(!slug || !name) throw new Error('Pemakaian: bun run add-dinas pu "Dinas Pekerjaan Umum"');
if(!process.env.DATABASE_URL) throw new Error("Isi DATABASE_URL terlebih dahulu.");
const sql=postgres(process.env.DATABASE_URL);
try {
  await sql`insert into dinas (slug,name) values (${slug},${name}) on conflict (slug) do update set name=excluded.name`;
  console.log("Dinas disimpan.");
} finally { await sql.end(); }
