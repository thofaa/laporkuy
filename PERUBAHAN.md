# Perubahan pelengkap LaporKuy

Paket ini adalah salinan pengembangan dari ZIP awal, bukan hasil pull terbaru dari GitHub temanmu.

## Mencoba tanpa mengubah proyek lama

Ekstrak ke folder terpisah, buka folder yang berisi package.json, lalu jalankan `bun install` dan `bun run demo`. Akun contoh ada pada halaman Masuk dan README.md.

## Menggabungkan ke proyek bersama

Simpan atau commit pekerjaan lokal terlebih dahulu. Buat branch baru, misalnya `git switch -c frontend-pelengkap`. Tambahkan file baru dan bandingkan file yang diubah di bawah ini dengan versi temanmu. Jangan menimpa .env, .git, node_modules, atau perubahan yang belum disimpan.

Untuk repo yang masih sama persis dengan ZIP awal, tersedia pelengkap.patch. Periksa dari direktori repo dengan `git apply --check pelengkap.patch`. Terapkan dengan `git apply pelengkap.patch` hanya jika pemeriksaan berhasil. Patch tidak mencakup file patch ini maupun dokumen PERUBAHAN.md. Bila kode temanmu sudah berubah, gabungkan file terkait secara manual.

## File yang diubah

- `.env.example`
- `README.md`
- `db/schema.sql`
- `nginx/default.conf`
- `package.json`
- `src/client/App.jsx`
- `src/client/components/ChatPieChart.jsx`
- `src/client/components/Footer.jsx`
- `src/client/components/Header.jsx`
- `src/client/components/ReportHeader.jsx`
- `src/client/main.jsx`
- `src/client/pages/Auth.jsx`
- `src/client/pages/Landing.jsx`
- `src/client/pages/Report.jsx`
- `src/server/index.js`

## File baru

- `db/migrations/20261029000000_report_workflow.sql`
- `scripts/add-dinas.js`
- `scripts/demo.js`
- `scripts/set-role.js`
- `src/client/components/DemoBanner.jsx`
- `src/client/components/ReportWidgets.jsx`
- `src/client/lib/api.js`
- `src/client/pages/Government.jsx`
- `src/client/pages/Info.jsx`
- `src/client/pages/PublicReports.jsx`
- `src/client/pages/TrackReport.jsx`
- `src/client/workflow.css`
- `src/server/api.js`
- `src/server/auth.js`
- `src/server/demo-store.js`
- `src/server/postgres-store.js`
- `src/server/storage.js`
- `src/shared/reports.js`
- `tests/workflow.test.js`

## Hasil verifikasi

- 10 pengujian API lulus, dengan 40 assertions.
- Build HTML/React/CSS berhasil.
- Pengujian browser berhasil: login per role, dashboard, tanggapan/progres, pencarian/hasil kosong, pelacakan/timeline, pengiriman laporan beserta foto, larangan dashboard untuk masyarakat, dan tampilan 390 px. Tidak ada error JavaScript browser selama skenario tersebut.
- Tiga migrasi SQL diuji pada mesin PostgreSQL PGlite: tabel, relasi, sesi, insert/update laporan, riwayat dan batas progres. Pernyataan extension pgcrypto dikecualikan pada pengujian ini karena PGlite menyediakan gen_random_uuid bawaan tetapi tidak menyertakan extension itu.
- Adapter postgres.js dan penyimpanan S3/SeaweedFS belum diuji terhadap layanan sungguhan. Mode demo telah diuji dan dapat dipakai tanpa kedua layanan tersebut.

## Batas cakupan

Integrasi AI/JEV dan integrasi resmi pemerintah belum diimplementasikan. Halaman pemerintah memakai pembaruan manual oleh petugas. Lihat README.md untuk batas lain dan panduan database.
