const SIMPLE = {
  "/tentang": ["Tentang LaporKuy", "LaporKuy adalah platform pengaduan infrastruktur, layanan, dan program publik. Masyarakat dapat mengirim laporan, mencatat nomor tiket, dan memantau tanggapan petugas. Platform ini sudah terintegrasi AI Decision Model untuk kebutuhan routing laporan pengguna, jadi pelapor tidak perlu susah-susah memikirkan ke mana laporannya akan bermuara dan memilih satu-satu dinas yang sesuai."],
  "/kontak": ["Hubungi pengelola", "Untuk demonstrasi lomba, hubungi tim pengembang LaporKuy. Kanal kontak instansi resmi belum dikonfigurasi pada prototipe ini."],
};

const LEGAL = {
  "/syarat": {
    title: "Syarat Layanan",
    intro: "Dengan membuat akun atau menggunakan LaporKuy, kamu menyetujui syarat di bawah ini.",
    sections: [
      {
        h: "1. Tentang layanan",
        p: ["LaporKuy adalah platform pelaporan layanan dan program publik Kota Malang."],
      },
      {
        h: "2. Bukan layanan darurat",
        p: ["Jangan gunakan LaporKuy untuk keadaan darurat (kebakaran, kecelakaan, kejahatan yang sedang berlangsung, bencana, atau ancaman keselamatan). Hubungi layanan darurat setempat secara langsung."],
      },
      {
        h: "3. Akun",
        p: ["Kamu wajib memberi email yang valid dan menjaga kerahasiaan kata sandi.",
             "Kamu bertanggung jawab atas aktivitas yang dilakukan melalui akunmu.",
             "Pengelola dapat menonaktifkan akun yang melanggar syarat ini."],
      },
      {
        h: "4. Isi laporan dan perilaku pengguna",
        p: ["Kirim hanya informasi yang benar, relevan, dan berkaitan dengan layanan atau program publik. Kamu dilarang:"],
        p: ["mengirim laporan palsu, menyesatkan, atau berulang tanpa alasan yang jelas;",
             "memuat ujaran kebencian, pelecehan, ancaman, konten pornografi, atau konten yang melanggar hukum;",
             "mencantumkan data pribadi pihak lain (nomor identitas, nomor telepon, alamat rumah) tanpa izin;",
             "mengunggah foto yang bukan milikmu atau melanggar hak pihak lain, atau dokumen sensitif;",
             "mencoba membobol, membebani, atau mengganggu sistem, atau mengakses data yang bukan hakmu;",
             "menyamar sebagai petugas, admin, atau orang lain."],
      },
      {
        h: "5. Foto dan lokasi",
        p: ["Setiap laporan wajib memuat titik lokasi di peta. Pastikan foto tidak menampilkan wajah atau data pribadi orang lain yang tidak perlu."],
      },
      {
        h: "6. Moderasi dan publikasi",
        p: ["Laporan baru bersifat pribadi secara bawaan.",
             "Laporan hanya tampil di katalog publik jika kamu mencentang izin publikasi dan admin telah memeriksa serta menyetujuinya.",
             "Yang dipublikasikan hanya ringkasan yang telah diredaksi (judul publik, lokasi umum, dan deskripsi ringkas). Identitas pelapor, foto, dan isi asli laporan tidak ditampilkan.",
             "Admin dapat menahan, menyamarkan, atau menolak publikasi laporan yang melanggar syarat ini."],
      },
      {
        h: "7. Penanganan laporan",
        p: ["Petugas instansi dapat memperbarui status, progres, dan tanggapan atas laporan yang menjadi kewenangan dinasnya. Admin memantau secara baca-saja.",
             "Saat petugas menandai laporan selesai, kamu dapat menyetujui atau menolak. Jika ditolak, laporan dikembalikan untuk ditangani kembali dan penolakan tercatat di riwayat.",
             "Riwayat penanganan dan diskusi antara pelapor dan instansi tersimpan pada laporan terkait."],
      },
      {
        h: "8. Hak atas konten",
        p: ["Kamu tetap memiliki hak atas isi laporan dan fotomu. Dengan mengirimkannya, kamu memberi LaporKuy izin terbatas untuk menyimpan, memproses, menampilkan kepada pihak yang berwenang menanganinya, dan (bila kamu mengizinkan publikasi) menampilkan ringkasan yang telah diredaksi di katalog publik."],
      },
      {
        h: "9. Batasan tanggung jawab",
        p: ["Layanan disediakan apa adanya sebagai prototipe, tanpa jaminan ketersediaan, keakuratan, atau kesesuaian untuk tujuan tertentu. Sejauh diizinkan hukum, pengembang tidak bertanggung jawab atas kerugian yang timbul dari penggunaan layanan, gangguan sistem, kehilangan data, atau tidak ditindaklanjutinya suatu laporan."],
      },
      {
        h: "10. Perubahan syarat",
        p: ["Syarat ini dapat diperbarui sewaktu-waktu. Penggunaan layanan setelah perubahan berarti kamu menyetujui syarat yang baru. Tanggal pembaruan terakhir tercantum di bagian atas halaman ini."],
      },
      {
        h: "11. Kontak",
        p: ["Pertanyaan tentang syarat ini dapat disampaikan kepada tim pengembang LaporKuy melalui halaman Hubungi Kami."],
      },
    ],
  },

  "/privasi": {
    title: "Kebijakan Privasi",
    intro: "Kebijakan ini menjelaskan data apa yang dikumpulkan LaporKuy, untuk apa digunakan, dan bagaimana kamu dapat mengendalikannya.",
    sections: [
      {
        h: "1. Data yang kami kumpulkan",
        p: ["Data akun: nama lengkap, email, hash sandi, serta peran akun.",
             "Data laporan: judul, lokasi, deskripsi, titik koordinat (lintang dan bujur), alamat hasil pencarian peta, dan foto bila kamu mengunggahnya.",
             "Data penanganan: status, progres, tanggapan petugas, riwayat perubahan, pesan diskusi, dan keputusan persetujuan atau penolakan penyelesaian."],
      },
      {
        h: "2. Cara kami menggunakan data",
        p: ["membuat dan mengelola akunmu serta mengautentikasi sesi;",
             "menerima, merutekan, dan menindaklanjuti laporan oleh instansi yang berwenang;",
             "menampilkan riwayat dan status laporan kepadamu;",
             "menyusun statistik agregat pada dashboard petugas, misalnya jumlah laporan per periode dan tingkat kekritisan;",
             "mempublikasikan ringkasan yang telah diredaksi di katalog publik, hanya jika kamu mengizinkan dan admin menyetujui;",
             "menjaga keamanan sistem dan mencegah penyalahgunaan."],
        p: ["Kami tidak menjual datamu dan tidak menggunakannya untuk iklan."],
      },
      {
        h: "3. Siapa yang dapat melihat datamu",
        p: ["Kamu: semua laporan, foto, dan diskusi pada akunmu.",
             "Petugas instansi: laporan yang menjadi kewenangan dinasnya.",
             "Admin pemerintah: seluruh laporan untuk pemantauan dan moderasi.",
             "Publik: hanya ringkasan teredaksi dari laporan yang kamu izinkan dan telah disetujui admin. Identitas, foto, dan isi asli tidak ditampilkan."],
        p: ["Karena laporan dapat memuat identitas dan foto, hindari mencantumkan informasi pribadi yang tidak diperlukan."],
      },
      {
        h: "4. Layanan pihak ketiga",
        p: ["Agar fitur berjalan, peramban atau server kami berkomunikasi dengan layanan lain:"],
        p: ["Layanan peta dan pencarian alamat (Nominatim/OpenStreetMap): titik koordinat atau kata kunci lokasi yang kamu pilih dikirim untuk menghasilkan alamat.",
             "Aset peta (Protomaps): font dan ikon peta dimuat dari server Protomaps sehingga alamat IP-mu dapat terlihat oleh penyedia tersebut.",
             "Google Fonts dan logo Google: dimuat dari server Google, sehingga alamat IP-mu dapat terlihat oleh Google.",
             "Penyimpanan berkas (MinIO/SeaweedFS): foto yang diunggah disimpan di server penyimpanan milik penyelenggara dengan nama acak."]
      },
      {
        h: "5. Hakmu",
        p: ["Sesuai peraturan pelindungan data pribadi yang berlaku di Indonesia (termasuk UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi), kamu dapat meminta untuk:"],
        p: ["mengakses dan memperoleh salinan data pribadimu;",
             "memperbaiki data yang tidak akurat;",
             "menghapus data atau mengakhiri pemrosesannya;",
             "menarik izin publikasi laporan;",
             "mengajukan keberatan atas pemrosesan tertentu."],
        p: ["Hubungi kami melalui halaman Hubungi Kami untuk mengajukan permintaan."],
      },
      {
        h: "6. Anak-anak",
        p: ["LaporKuy ditujukan bagi pengguna dewasa. Kami tidak dengan sengaja mengumpulkan data pribadi anak tanpa persetujuan orang tua atau wali."],
      },
      {
        h: "7. Perubahan kebijakan",
        p: ["Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan penting akan ditampilkan pada halaman ini dengan tanggal pembaruan terbaru."],
      },
    ],
  },
};

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function Section({ section }) {
  return <section className="lk-legal-section" id={slug(section.h)}>
    <h2>{section.h}</h2>
    {section.p?.map((par, i) => <p key={i}>{par}</p>)}
    {section.ul && <ul>{section.ul.map((item, i) => <li key={i}>{item}</li>)}</ul>}
  </section>;
}

export default function Info({ path }) {
  if (LEGAL[path]) {
    const page = LEGAL[path];
    return <section className="lk-page container lk-legal"><p className="lk-kicker">LAPORKUY</p><h1>{page.title}</h1><p className="lk-legal__updated">Terakhir diperbarui: 10 November 2026</p>
      <div className="lk-legal__intro"><p>{page.intro}</p></div>
      {page.sections.map((s, i) => <Section key={i} section={s} />)}
      <div className="lk-legal__foot"><a className="btn btn--primary" href="/">Kembali ke beranda</a><a className="lk-text-link" href="#top">Kembali ke atas ↑</a></div>
    </section>;
  }
  const [title, text] = SIMPLE[path] || ["Halaman tidak ditemukan", "Alamat yang kamu buka belum tersedia. Kembali ke beranda atau buka katalog pengaduan."];
  return <section className="lk-page container"><p className="lk-kicker">LAPORKUY</p><h1>{title}</h1><p className="lk-body-text lk-info">{text}</p><a className="btn btn--primary" href="/">Kembali ke beranda</a></section>;
}