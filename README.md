## Perubahan yang dikerjakan

### 1. Navigasi akun masyarakat

- Mengarahkan masyarakat ke landing page setelah login.
- Menampilkan akses Laporan Saya dan tombol keluar pada navigasi utama.
- Menghapus menu Lacak Laporan yang bertumpuk dengan Laporan Saya.
- Menghapus tautan Lacak Tiket dan Katalog Publik dari sidebar formulir.
- Mempertahankan menu Buat Laporan dan Riwayat Laporan pada formulir.

### 2. Laporan Saya

- Menampilkan laporan milik pengguna secara otomatis setelah halaman dibuka.
- Mempertahankan pencarian untuk memudahkan pengguna dengan banyak laporan.
- Menyediakan akses detail, status, progres, dan riwayat penanganan.
- Menambahkan tampilan ketika data sedang dimuat, kosong, atau gagal diambil.

### 3. Navigasi admin dan petugas dinas

- Membuat tampilan navigasi petugas yang berbeda dari masyarakat.
- Menyediakan menu dashboard, pengelolaan laporan, dan katalog publik.
- Menyesuaikan judul serta menu dengan peran akun.
- Mempertahankan navigasi petugas saat membuka katalog publik.
- Menyediakan tombol keluar dari akun.

### 4. Pengelolaan laporan

- Melengkapi halaman dashboard, daftar, dan detail laporan pemerintah.
- Menyediakan pembaruan status serta progres penanganan.
- Mendukung pemeriksaan laporan dan penugasan kepada dinas.
- Membedakan akses admin dengan petugas dinas berdasarkan kewenangannya.

### 5. Katalog publik

- Menambahkan halaman daftar dan detail laporan publik.
- Menampilkan ringkasan laporan tanpa identitas pelapor.
- Membatasi publikasi berdasarkan persetujuan pelapor dan pemeriksaan admin.
- Menyediakan akses katalog dari area masyarakat maupun petugas.

### 6. Landing page dan halaman informasi

- Menyesuaikan kembali landing page dengan struktur tampilan proyek teman.
- Mempertahankan bagian hero, pencarian, LiveChatSection, dan daftar laporan.
- Menghubungkan laporan terbaru dengan API.
- Menambahkan halaman FAQ, tentang, dan kontak.

### 7. Backend pendukung

- Menambahkan API untuk laporan pribadi, pelacakan, katalog publik,
  dan pengelolaan laporan pemerintah.
- Menambahkan pemeriksaan autentikasi, kepemilikan laporan, dan peran akun.
- Menambahkan dukungan penyimpanan PostgreSQL serta migrasi alur laporan.
- Melengkapi penanganan unggahan foto.
- Menambahkan fungsi API bersama untuk frontend.

### 8. Mode demo dan alat bantu

- Menambahkan mode demo dengan data sementara.
- Menyediakan akun contoh masyarakat, admin, dan petugas dinas.
- Menambahkan script pengaturan peran dan penambahan dinas.
- Menambahkan pengujian alur laporan dan pembatasan akses.

## Lokasi kode utama

| Lokasi | Pekerjaan terkait |
|---|---|
| `src/client/App.jsx` | Pengaturan halaman dan layout |
| `src/client/components/Header.jsx` | Navigasi utama dan tombol akun |
| `src/client/components/ReportHeader.jsx` | Header area laporan |
| `src/client/components/StaffLayout.jsx` | Layout dan navigasi petugas |
| `src/client/components/ReportWidgets.jsx` | Komponen status dan progres laporan |
| `src/client/pages/Auth.jsx` | Login dan pengalihan setelah masuk |
| `src/client/pages/Landing.jsx` | Landing page |
| `src/client/pages/Report.jsx` | Formulir dan riwayat laporan |
| `src/client/pages/TrackReport.jsx` | Laporan Saya dan pencarian |
| `src/client/pages/Government.jsx` | Dashboard dan pengelolaan laporan |
| `src/client/pages/PublicReports.jsx` | Katalog dan detail laporan publik |
| `src/client/pages/Info.jsx` | FAQ, tentang, dan kontak |
| `src/client/lib/api.js` | Pemanggilan API dari frontend |
| `src/client/workflow.css` | Gaya komponen laporan dan area petugas |
| `src/server/` | API, autentikasi, dan penyimpanan |
| `src/shared/reports.js` | Definisi bersama terkait laporan |
| `db/migrations/` | Migrasi database |
| `scripts/` | Mode demo dan alat administrasi |
| `tests/workflow.test.js` | Pengujian alur laporan |

## Menjalankan versi demo

Jalankan dari folder yang berisi `package.json`:

    bun install
    bun run demo

Buka alamat yang ditampilkan di terminal.

Mode demo menggunakan data sementara. Perubahan data akan hilang ketika
server dimulai ulang.

## Catatan integrasi

Pekerjaan awal disimpan pada branch `frontend-javi`, kemudian diintegrasikan
melalui branch `integrasi-javi` dan Pull Request #3 ke `master`.

Hasil integrasi mempertahankan isi kode versi `frontend-javi`.
Perubahan khusus master yang tidak terdapat pada versi tersebut tidak
dipertahankan dalam hasil integrasi. Riwayat commit kedua versi tetap tersambung.

## Catatan dokumentasi

Daftar ini merangkum pekerjaan selama pengembangan. Untuk mengetahui
perubahan baris kode secara tepat, lihat tab Files changed pada Pull Request
serta riwayat commit terkait.
