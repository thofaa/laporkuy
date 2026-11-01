# LaporKuy pelengkap frontend dan alur laporan

Paket ini melanjutkan kode awal LaporKuy dari ZIP temanmu. Frontend React tetap memakai tema monokrom. Halaman pemerintah, katalog publik, pelacakan, dan riwayat tersambung ke API pelengkap. Tidak memerlukan dependency baru di luar package.json awal.

## Cara tercepat mencoba tampilan dan semua interaksi

1. Ekstrak ZIP ke folder terpisah agar mudah dibandingkan dengan proyek lama.
2. Buka folder yang langsung berisi `package.json` di VS Code.
3. Buka terminal lalu jalankan satu per satu:

```powershell
bun install
bun run demo
```

4. Buka alamat yang dicetak terminal, biasanya `http://localhost:3000`.
5. Buka halaman Masuk, pilih salah satu tombol akun demo, kemudian klik Masuk.

Tidak perlu `.env`, Docker, atau PostgreSQL untuk mode demo. Jika `.env` lama berisi PORT berbeda, gunakan alamat yang ditampilkan terminal. Mode demo ditandai banner kuning. Semua akun, gambar, laporan, dan perubahan demo hanya ada di memori proses; data akan direset ketika server dimulai ulang. Jangan gunakan mode demo untuk menerima pengaduan sungguhan.

| Akun demo | Email | Password |
| --- | --- | --- |
| Masyarakat | warga@demo.test | WargaDemo123! |
| Admin pemerintah/pusat | admin@demo.test | AdminDemo123! |
| Petugas dinas PU | petugas@demo.test | PetugasDemo123! |

Tiket contoh: `LPK-DEMO0001`, `LPK-DEMO0002`, `LPK-DEMO0003`. Lacak menggunakan akun masyarakat di atas. Akun masyarakat baru hanya dapat melacak laporannya sendiri.

## Halaman yang tersedia

| Alamat | Fungsi |
| --- | --- |
| `/` | Beranda dengan ringkasan laporan publik dari API |
| `/masuk`, `/daftar` | Autentikasi email; role menentukan halaman sesudah login |
| `/lapor` | Membuat laporan, foto opsional, izin publikasi opsional |
| `/log` | Riwayat laporan milik pengguna beserta nomor tiket |
| `/lacak?tiket=LPK-DEMO0001` | Detail pribadi, progres persentase, dan riwayat tanggapan |
| `/laporan` | Katalog publik, pencarian, filter status, dan pagination |
| `/laporan/LPK-DEMO0001` | Ringkasan laporan yang sudah diizinkan untuk publik |
| `/pemerintah` | Dashboard admin/petugas, ringkasan dan filter laporan |
| `/pemerintah/laporan/ID` | Detail, tanggapan, progres, penugasan dinas, dan moderasi |
| `/tentang`, `/faq`, `/kontak`, `/privasi`, `/syarat` | Informasi prototipe |

## Cara menguji alur demo

1. Masuk sebagai Masyarakat, buat laporan, dan simpan nomor tiketnya. Centang izin publikasi jika ingin mencoba katalog.
2. Keluar melalui menu akun kanan atas.
3. Masuk sebagai Admin pemerintah. Buka dashboard, klik Tinjau pada laporan tersebut.
4. Pilih dinas, status, progres, dan tulis tanggapan. Simpan tanggapan.
5. Bila pelapor memberi izin, admin dapat mengisi judul/deskripsi publik yang sudah dibersihkan dari data pribadi, lalu mencentang publikasi.
6. Masuk kembali sebagai Masyarakat, buka Riwayat atau Lacak Laporan. Tanggapan dan progres telah berubah.
7. Buka Katalog untuk melihat ringkasan yang sudah diterbitkan.

Progres diisi petugas, bukan dihitung dengan AI. Status Selesai harus 100%; status Ditolak harus 0%. Status Digabung belum memiliki alur penggabungan, sehingga tidak ditawarkan dalam form perubahan.

## Memakai PostgreSQL sungguhan

1. Pasang/jalankan PostgreSQL. Bila memakai Docker Desktop dari konfigurasi proyek ini:

```powershell
docker compose up -d db minio
```

2. Salin `.env.example` menjadi `.env` (jangan menimpa `.env` yang sudah kamu atur):

```powershell
Copy-Item .env.example .env
```

3. Isi `DATABASE_URL` sesuai database lokal. Pastikan `DEMO_MODE=false`.
4. Jalankan:

```powershell
bun run db:migrate
bun dev
```

Migrasi dijalankan berurutan dan dicatat pada `schema_migrations`. Migrasi pelengkap menambahkan `image_url`, progres, izin publikasi, field ringkasan publik, dan masa berlaku sesi. Tidak menghapus data lama. `db/schema.sql` adalah snapshot untuk database kosong; jangan mengimpor snapshot dan menjalankan migrasi awal pada database yang sama. Jika database lama dibuat melalui impor SQL manual dan belum memiliki catatan migrasi, selaraskan baseline migrasinya bersama pengelola backend sebelum melanjutkan.

Untuk memakai unggahan foto, jalankan layanan SeaweedFS/S3 dan isi variabel `MINIO_*`. Untuk teks saja layanan penyimpanan tidak diperlukan. Aplikasi melayani URL `/uploads/` sendiri sehingga akses foto lokal tidak memerlukan Nginx. Nama objek acak bukan pengganti otorisasi: foto tidak dimasukkan ke katalog publik, tetapi siapa pun yang mendapatkan URL gambar dapat membukanya. Penguatan akses objek privat perlu dikerjakan sebelum menampung foto sensitif.

### Menyiapkan akun petugas

Daftar akun melalui web dahulu. Pada terminal pengelola database:

```powershell
bun run add-dinas pu "Dinas Pekerjaan Umum"
bun run set-role petugas@contoh.id pemerintah pu
bun run set-role pengelola@contoh.id admin
```

Ganti email dengan akun yang benar-benar didaftarkan. Role pemerintah wajib tertaut pada dinas dan hanya dapat melihat laporan untuk dinas tersebut. Admin pusat dapat menangani seluruh laporan, menetapkan dinas, dan menyetujui publikasi. Role tidak dapat dipilih sendiri dari form pendaftaran. Masuk ulang setelah mengubah role.

### Docker seluruh stack (opsional)

Install dependency lebih dulu dari host (`bun install`), lalu jalankan database dan migrasi seperti langkah di atas. Setelah itu `docker compose up -d` membuka Nginx pada `http://localhost:8080`. Jangan jalankan server host pada port yang sama bersamaan. Konfigurasi Nginx pelengkap menuju service app, dan direktori node_modules tersedia melalui bind mount seperti konfigurasi awal. Untuk lingkungan lintas OS, instal dependency di dalam container/volume Linux sebelum penggunaan penuh; mode demo lokal merupakan jalur termudah untuk pengerjaan frontend.

## Pembagian file frontend

- `src/client/pages/Government.jsx`: dashboard, detail dan form tindak lanjut.
- `src/client/pages/PublicReports.jsx`: katalog, pencarian, pagination dan detail publik.
- `src/client/pages/TrackReport.jsx`: form pencarian tiket dan timeline pribadi.
- `src/client/components/ReportWidgets.jsx`: badge, progress, timeline, tabel navigasi halaman.
- `src/client/workflow.css`: CSS pelengkap responsif.
- `src/client/lib/api.js`: pemanggilan API dan token.
- `src/client/App.jsx`: pemilihan halaman.

Lihat `PERUBAHAN.md` untuk daftar file baru dan file yang diganti. Salin file pelengkap secara terarah jika ingin menggabungkan dengan branch temanmu. Paket tidak menyertakan `.git`, `.env`, atau `node_modules`.

## Kontrak API

Request privat memakai `Authorization: Bearer TOKEN`. Body POST/PATCH berupa JSON, kecuali upload yang memakai FormData.

| Method | Endpoint | Hasil / akses |
| --- | --- | --- |
| GET | `/api/meta` | Status mode demo; akun contoh hanya ada di demo |
| POST | `/api/auth/register` | `{email,password,full_name}`; selalu membuat role user |
| POST | `/api/auth/login` | `{email,password}` → `{token,user}` |
| GET | `/api/auth/me` | Akun dari token sesi server |
| POST | `/api/auth/logout` | Membatalkan token |
| POST | `/api/submit-laporan` | `{description_raw,image_url,is_public}` → laporan + tiket |
| POST | `/api/upload-image` | FormData field `file`, perlu login, maksimum 5 MB |
| GET | `/api/log` | Riwayat pribadi |
| GET | `/api/track/:ticket` | Laporan pribadi dan history; hanya pemilik/admin/dinas berwenang |
| GET | `/api/reports?q=&status=&page=` | Ringkasan publik; 12 per halaman |
| GET | `/api/reports/:ticket` | Detail publik; tidak berisi identitas, isi mentah, atau gambar |
| GET | `/api/government/reports?q=&status=&page=` | Daftar dan summary berdasarkan hak akses |
| GET | `/api/government/reports/:id` | Detail pribadi dan history untuk petugas berwenang |
| GET | `/api/government/dinas` | Daftar dinas untuk petugas |
| PATCH | `/api/government/reports/:id` | Simpan status, progres, tanggapan, penugasan/publikasi khusus admin |

Body PATCH mencakup `status`, `progress_percent`, `note`, `expected_updated_at`; admin juga dapat mengisi `dinas_id`, `moderation_status` (`held`/`pending`/`published`), `public_title`, `public_location`, `description_redacted`. Kirim waktu versi terbaru dari detail agar perubahan petugas lain menghasilkan 409, bukan tertimpa.

## Pengujian dan batas implementasi

```powershell
bun test
bun run build:check
```

Tes API mencakup login/otorisasi per dinas, daftar publik tanpa identitas, pengiriman laporan, tracking pribadi, tanggapan/progres, persetujuan publikasi, konflik pembaruan, validasi dan logout. Adapter PostgreSQL memakai transaksi untuk status/history/notifikasi/audit.

Belum mencakup integrasi AI/JEV, integrasi resmi instansi pemerintah, pemulihan password, login Google, email/push notifikasi, atau penggabungan laporan duplikat. Tabel notifikasi diisi saat pembaruan PostgreSQL; pengiriman notifikasi dan antarmuka notifikasi belum dibuat. Redis belum digunakan. Statistik beranda berasal dari laporan yang sudah dipublikasikan dan bukan data percakapan live chat.

Pencarian/pagination saat ini menyaring data pada server setelah pembacaan tabel; optimalkan query/index/pagination langsung di database untuk volume besar. Sebelum menerima pengaduan sungguhan diperlukan deployment dengan HTTPS, penguatan sesi/rate limit, kebijakan data, dan otorisasi objek foto. Mode produksi harus menonaktifkan demo (`DEMO_MODE=false`, `NODE_ENV=production`).
