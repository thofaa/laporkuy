const CATEGORIES = [
  { icon: "road", label: "Infrastruktur Jalan", desc: "Jalan rusak, trotoar, drainase" },
  { icon: "trash", label: "Persampahan", desc: "Sampah menumpuk, TPS liar" },
  { icon: "lamp", label: "Penerangan Jalan", desc: "PJU mati, kabel membahayakan" },
  { icon: "water", label: "Air & Limbah", desc: "Saluran tersumbat, banjir" },
  { icon: "bus", label: "Transportasi", desc: "Angkutan umum, parkir liar" },
  { icon: "health", label: "Kesehatan", desc: "Puskesmas, obat, layanan" },
];

const STATS = [
  { value: "1.284", label: "Laporan diterima" },
  { value: "912", label: "Laporan selesai" },
  { value: "3,2 hari", label: "Rata-rata tanggap" },
];

const REPORTS = [
  {
    category: "Infrastruktur Jalan",
    status: "Sedang ditangani",
    tone: "progress",
    title: "Jalan berlubang di Jl. Soekarno Hatta",
    teaser:
      "Lubang selebar ±40 cm membahayakan pengendara, terutama saat hujan.",
    date: "21 Okt 2026",
    ticket: "LPR-2026-1042",
  },
  {
    category: "Persampahan",
    status: "Selesai",
    tone: "resolved",
    title: "Sampah menumpuk di TPS Jl. Ijen",
    teaser:
      "Tumpukan sampah tidak diangkut selama seminggu dan mulai berbau.",
    date: "20 Okt 2026",
    ticket: "LPR-2026-1038",
  },
  {
    category: "Penerangan Jalan",
    status: "Diteruskan ke dinas",
    tone: "routed",
    title: "Lampu PJU mati di Jl. Semeru",
    teaser:
      "Lampu mati sejak dua minggu lalu, jalan gelap saat malam.",
    date: "19 Okt 2026",
    ticket: "LPR-2026-1035",
  },
];

function CategoryIcon({ name }) {
  const common = {
    width: 28,
    height: 28,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (name) {
    case "road":
      return (
        <svg {...common}>
          <path d="M4 21 8 3M20 21 16 3M12 5v3M12 12v3M12 19v2" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5" />
        </svg>
      );
    case "lamp":
      return (
        <svg {...common}>
          <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11c.6.5 1 1.2 1 2h4c0-.8.4-1.5 1-2a6 6 0 0 0-3-11Z" />
        </svg>
      );
    case "water":
      return (
        <svg {...common}>
          <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />
        </svg>
      );
    case "bus":
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="15" rx="2" />
          <path d="M5 11h14M8 18v2M16 18v2M8 7h8" />
          <circle cx="8.5" cy="14.5" r=".9" />
          <circle cx="15.5" cy="14.5" r=".9" />
        </svg>
      );
    case "health":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
  }
}

export default function Landing() {
  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <p className="hero__eyebrow">Pemerintah Kota Malang</p>
          <h1 className="hero__title">Laporkuy</h1>
          <p className="hero__lead">
            Satu form, tanpa memilih dinas, status jelas. Laporkan masalah
            layanan publik dan pantau penanganannya secara transparan.
          </p>
          <div className="hero__actions">
            <a className="btn btn--primary btn--lg" href="/lapor">
              Buat Laporan
            </a>
            <a className="btn btn--outline btn--lg" href="/lacak">
              Lacak Laporan
            </a>
          </div>
        </div>
      </section>

      <section className="search-block" aria-labelledby="search-title">
        <div className="container">
          <div className="search-card">
            <h2 className="visually-hidden" id="search-title">
              Cari laporan atau kategori
            </h2>
            <form className="search-form" action="/laporan" method="get">
              <label className="visually-hidden" htmlFor="q">
                Kata kunci laporan atau kategori
              </label>
              <input
                className="search-form__input"
                id="q"
                name="q"
                type="search"
                placeholder="Cari laporan atau kategori…"
                autoComplete="off"
              />
              <button className="btn btn--primary" type="submit">
                Cari
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="kategori-title">
        <div className="container">
          <div className="section__head">
            <h2 className="section__title" id="kategori-title">
              Laporkan masalah
            </h2>
            <p className="section__sub">
              Pilih kategori yang paling mendekati. Jev AI akan meneruskan
              laporan ke dinas yang berwenang.
            </p>
          </div>

          <ul className="category-grid">
            {CATEGORIES.map((item) => (
              <li key={item.label}>
                <a className="category-card" href={`/lapor?kategori=${encodeURIComponent(item.label)}`}>
                  <span className="category-card__icon">
                    <CategoryIcon name={item.icon} />
                  </span>
                  <span className="category-card__body">
                    <span className="category-card__label">{item.label}</span>
                    <span className="category-card__desc">{item.desc}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--gray" aria-labelledby="statistik-title">
        <div className="container">
          <div className="section__head">
            <h2 className="section__title" id="statistik-title">
              Transparansi layanan
            </h2>
            <p className="section__sub">
              Ringkasan penanganan laporan warga Kota Malang.
            </p>
          </div>

          <dl className="stat-grid">
            {STATS.map((stat) => (
              <div className="stat-card" key={stat.label}>
                <dt className="stat-card__label">{stat.label}</dt>
                <dd className="stat-card__value">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section" aria-labelledby="terbaru-title">
        <div className="container">
          <div className="section__head section__head--row">
            <div>
              <h2 className="section__title" id="terbaru-title">
                Laporan terbaru
              </h2>
              <p className="section__sub">
                Ditampilkan anonim. Identitas pelapor tidak pernah dipublikasikan.
              </p>
            </div>
            <a className="btn btn--ghost" href="/laporan">
              Lihat semua
            </a>
          </div>

          <ul className="report-grid">
            {REPORTS.map((report) => (
              <li key={report.ticket}>
                <a className="report-card" href={`/laporan/${report.ticket}`}>
                  <div className="report-card__meta">
                    <span className="report-card__category">{report.category}</span>
                    <span className={`status status--${report.tone}`}>
                      {report.status}
                    </span>
                  </div>
                  <h3 className="report-card__title">{report.title}</h3>
                  <p className="report-card__teaser">{report.teaser}</p>
                  <p className="report-card__foot">
                    <time>{report.date}</time>
                    <span aria-hidden="true">·</span>
                    <span>{report.ticket}</span>
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--compact" aria-labelledby="bantuan-title">
        <div className="container quick-grid">
          <h2 className="visually-hidden" id="bantuan-title">
            Bantuan
          </h2>
          <a className="quick-card" href="/tentang">
            <span className="quick-card__title">Tentang Kami</span>
            <span className="quick-card__desc">Kenali Laporkuy dan cara kerjanya.</span>
          </a>
          <a className="quick-card" href="/faq">
            <span className="quick-card__title">FAQ</span>
            <span className="quick-card__desc">Pertanyaan umum seputar pelaporan.</span>
          </a>
          <a className="quick-card" href="/kontak">
            <span className="quick-card__title">Hubungi Kami</span>
            <span className="quick-card__desc">Bantuan dan masukan untuk platform.</span>
          </a>
        </div>
      </section>
    </>
  );
}
