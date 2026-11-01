const LAYANAN = [
  { href: "/lapor", label: "Buat Laporan" },
  { href: "/log", label: "Laporan Saya" },
  { href: "/laporan", label: "Katalog Pengaduan" },
  { href: "/faq", label: "FAQ" },
];

const PEMERINTAH = [
  { href: "/tentang", label: "Tentang Kami" },
  { href: "/kontak", label: "Hubungi Kami" },
  { href: "/privasi", label: "Kebijakan Privasi" },
  { href: "/syarat", label: "Syarat Layanan" },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <p className="footer__logo">
            Laporkuy<span className="brand__dot">.</span>
          </p>
          <p className="footer__desc">
            Platform pelaporan layanan dan program publik Kota Malang. Satu
            form, tanpa memilih dinas, status jelas.
          </p>
        </div>

        <nav className="footer__col" aria-labelledby="footer-layanan">
          <h2 className="footer__title" id="footer-layanan">Layanan</h2>
          <ul>
            {LAYANAN.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer__col" aria-labelledby="footer-pemerintah">
          <h2 className="footer__title" id="footer-pemerintah">Pemerintah</h2>
          <ul>
            {PEMERINTAH.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer__col">
          <h2 className="footer__title">Kontak</h2>
          <ul>
            <li>
              <a href="/kontak">tim pengembang LaporKuy</a>
            </li>
            <li>
              <a href="/pemerintah">Dashboard pemerintah</a>
            </li>
            <li>Prototipe untuk demonstrasi lomba</li>
          </ul>
        </div>
      </div>

      <div className="container footer__bottom">
        <p>© 2026 LaporKuy · Proyek demonstrasi</p>
        <p className="footer__note">
          Bukan kanal resmi pemerintah atau layanan darurat.
        </p>
      </div>
    </footer>
  );
}
