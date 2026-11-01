# Laporkuy

Platform pelaporan layanan dan program publik Kota Malang. Warga cukup mengisi
satu laporan tanpa memilih dinas; instansi dan admin pemerintah memantau serta
menindaklanjuti dengan status dan progres yang jelas.

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| Frontend | React 19, recharts (grafik), mapLibre GL + react-map-gl + pmtiles/@protomaps/basemaps (peta) |
| Backend | Bun (runtime), Elysia (HTTP), skema sesi & hash `scrypt`, `postgres.js` |
| Database | PostgreSQL 16 |
| File/media | MinIO / SeaweedFS (unggahan foto) |
| Infra | Docker Compose, Nginx (reverse proxy + tile peta), Redis (tersedia, belum terpakai) |

## Cara Menjalankan

### Opsi A (menggunakan docker)

```sh
docker compose up -d --build && DATABASE_URL="postgres://laporkuy:laporkuy@localhost:5432/laporkuy" bun run db:migrate
```

Buka <http://localhost:8080>.

### Opsi B (pengembangan lokal)

Jalankan database/media lewat Docker, aplikasi lewat Bun:

```sh
docker compose up -d db minio
```

```sh
bun install
```

```sh
DATABASE_URL="postgres://laporkuy:laporkuy@localhost:5432/laporkuy" bun run db:migrate
```

```sh
bun run dev        # hot-reload di http://localhost:3001
```

### Akun contoh

Akun di bawah dibuat otomatis oleh migrasi `20261103000000_seed_demo.sql` saat
pertama kali `db:migrate` dijalankan.

| Peran | Email | Kata sandi |
|---|---|---|
| Warga (pelapor) | siti.rahayu@example.com | Rahayu123! |
| Instansi (Dinas PUPR) | instansi@laporkuy.dev | Instansi@123 |
| Admin pemerintah | admin@example.com | Admin@123 |

## Progress Saat Ini

**Selesai:**

- Landing page, login/registrasi, form buat laporan dengan peta (pilih titik,
  reverse-geocode), dan riwayat laporan warga.
- Peran ganda: **warga**, **instansi (dinas)**, **admin** pemerintah.
- Dashboard instansi & admin dengan grafik recharts (laporan masuk per hari/minggu/bulan
  dan tingkat kekritisan) serta statistik.
- Instrumentasi status: sistem (Terkirim, Perlu ditinjau) dipisah dari status
  tindak lanjut (Diterima, Sedang ditangani, Selesai, Digabung).
- Tindak lanjut laporan oleh instansi: status, progres, tanggapan; admin
  memantau (baca-saja).
- **Alur persetujuan selesai dua arah**: instansi menandai selesai → warga
  menyetujui atau menolak; jika ditolak, progres kembali ke tahap sebelumnya dan
  penolakan terekam di riwayat penanganan.
- **Diskusi penanganan** dua arah (feedback warga ⇄ instansi) dengan pesan
  pengirim rata kanan dan lawan bicara rata kiri.
- Menu **Tinjau Laporan** untuk admin (antrean laporan "perlu ditinjau").
- Katalog publik (redacted) dan halaman informasi (FAQ, tentang, kontak).
- Migrasi database lengkap, mode demo, dan akun contoh.

**Rencana berikutnya:**

- Integrasi AI/penetapan dinas otomatis untuk laporan yang masuk ke antrean
  "Perlu ditinjau".
- Pemberitahuan (notifikasi) aktif ke pengguna.
