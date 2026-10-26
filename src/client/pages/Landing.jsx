import LiveChatSection from "../components/LiveChatSection.jsx";
import reportImage from "../assets/report-placeholder.svg";
import shadeUrl from "../assets/shade.png";

// ponytail: gate di klik-CTA saja, bukan route guard global
function handleLoginGate(event) {
  if (!localStorage.getItem("laporkuy_user")) {
    event.preventDefault();
    window.location.href = "/masuk";
  }
}

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

export default function Landing() {
  return (
    <>
      <section
        className="hero"
        style={{ backgroundImage: `url(${shadeUrl})` }}
      >
        <div className="container hero__inner">
          <p className="hero__eyebrow">Pemerintah Kota Malang</p>
          <h1 className="hero__title">Laporkuy</h1>
          <p className="hero__lead">
            Satu form, tanpa memilih dinas, status jelas. Laporkan masalah
            layanan publik dan pantau penanganannya secara transparan.
          </p>
          <div className="hero__actions">
            <a
              className="btn btn--primary btn--lg"
              href="/lapor"
              onClick={handleLoginGate}
            >
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

      <LiveChatSection />

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

          <ul className="report-list">
            {REPORTS.map((report, index) => (
              <li
                className={`report-list__item${index % 2 === 1 ? " report-list__item--right" : ""}`}
                key={report.ticket}
                style={{ backgroundImage: `url(${reportImage})` }}
              >
                <a className="report-list__link" href={`/laporan/${report.ticket}`}>
                  <div className="report-card" data-border="true">
                    <div className="report-card__header">
                      <span className="report-card__category">{report.category}</span>
                      <time>{report.date}</time>
                    </div>
                    <div className="report-card__body">
                      <h3 className="report-card__title">{report.title}</h3>
                      <p className="report-card__teaser">{report.teaser}</p>
                      <p className="report-card__foot">
                        <span className={`status status--${report.tone}`}>
                          {report.status}
                        </span>
                        <span>{report.ticket}</span>
                      </p>
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

    </>
  );
}
