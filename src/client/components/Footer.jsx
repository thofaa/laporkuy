const LAYANAN = [
  { href: "/lapor", label: "Buat Laporan" },
  { href: "/lacak", label: "Lacak Laporan" },
  { href: "/kategori", label: "Kategori Laporan" },
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
              <a href="mailto:halo@laporkuy.malang.go.id">halo@laporkuy.malang.go.id</a>
            </li>
            <li>
              <a href="tel:+62341000000">(0341) 000-000</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container footer__bottom">
        <p>© 2026 Laporkuy · Pemerintah Kota Malang</p>
        <p className="footer__note">
          Bukan kanal darurat. Untuk keadaan darurat hubungi 112.
        </p>
      </div>
    </footer>
  );
}
