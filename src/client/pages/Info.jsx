const CONTENT = {
  "/tentang": ["Tentang LaporKuy", "LaporKuy adalah prototipe platform pengaduan infrastruktur, layanan, dan program publik. Masyarakat dapat mengirim laporan, mencatat nomor tiket, dan memantau tanggapan petugas. Proyek lomba ini belum terhubung dengan sistem resmi pemerintah."],
  "/faq": ["Pertanyaan umum", "Bagaimana cara melapor? Daftar atau masuk, buka Buat Laporan, lalu isi judul, lokasi, deskripsi, dan foto bila diperlukan. Bagaimana memantau laporan? Buka menu Riwayat laporan di dashboard. Mengapa laporan tidak ada di katalog? Laporan harus mendapat izin pelapor dan persetujuan admin sebelum dipublikasikan."],
  "/kontak": ["Hubungi pengelola", "Untuk demonstrasi lomba, hubungi tim pengembang LaporKuy. Kanal kontak instansi resmi belum dikonfigurasi pada prototipe ini."],
  "/privasi": ["Privasi laporan", "Laporan baru bersifat pribadi secara bawaan. Katalog hanya menampilkan ringkasan yang diizinkan pelapor dan diperiksa admin. Pelacakan pribadi memerlukan login. Hindari mencantumkan nomor identitas, kata sandi, atau informasi pribadi yang tidak diperlukan. Foto disimpan dengan alamat acak; jangan unggah dokumen sensitif. Kebijakan retensi dan penghapusan perlu ditetapkan sebelum penggunaan publik."],
  "/syarat": ["Ketentuan penggunaan prototipe", "Kirim informasi yang benar dan relevan dengan masalah layanan publik. LaporKuy merupakan proyek demonstrasi, bukan kanal darurat atau bukti laporan yang telah diterima pemerintah. Pada mode demo, seluruh data hanya disimpan sementara di memori."],
};
export default function Info({ path }) {
  const [title,text] = CONTENT[path] || ["Halaman tidak ditemukan", "Alamat yang kamu buka belum tersedia. Kembali ke beranda atau buka katalog pengaduan."];
  return <section className="lk-page container"><p className="lk-kicker">LAPORKUY</p><h1>{title}</h1><p className="lk-body-text lk-info">{text}</p><a className="btn btn--primary" href="/">Kembali ke beranda</a></section>;
}
