import postgres from "postgres";
const [email,role,slug] = process.argv.slice(2);
if (!email || !["user","admin","pemerintah"].includes(role) || (role === "pemerintah" && !slug)) {
  console.error("Pemakaian: bun run set-role email role [slug-dinas]. Role: user, admin, pemerintah. Dinas wajib untuk pemerintah.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) throw new Error("Isi DATABASE_URL di .env terlebih dahulu.");
if (process.env.DEMO_MODE === "true") throw new Error("Perintah ini untuk PostgreSQL, bukan mode demo.");
const sql=postgres(process.env.DATABASE_URL);
try {
  let dinasId=null;
  if (role === "pemerintah") {
    const [dinas]=await sql`select id from dinas where slug=${slug} and is_active=true`;
    if(!dinas) throw new Error("Slug dinas belum ada. Tambahkan dinas melalui bun run add-dinas.");
    dinasId=dinas.id;
  }
  const rows=await sql`update users set role=${role},dinas_id=${dinasId},updated_at=now() where email=${email.toLowerCase()} returning email,role`;
  if(!rows.length) throw new Error("Email belum terdaftar. Buat akun dari halaman Daftar terlebih dahulu.");
  console.log(`Role ${rows[0].email} diperbarui menjadi ${rows[0].role}. Masuk ulang untuk memperbarui menu.`);
} finally { await sql.end(); }
