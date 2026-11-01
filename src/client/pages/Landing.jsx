import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Notice, STATUSES } from "../components/ReportWidgets.jsx";
import LiveChatSection from "../components/LiveChatSection.jsx";
import reportImage from "../assets/report-placeholder.svg";
import shadeUrl from "../assets/shade.png";

const STATUS_TONES = {
  submitted: "waiting",
  needs_review: "waiting",
  accepted: "progress",
  in_progress: "progress",
  resolved: "resolved",
};

function formatDate(value) {
  if (!value) return "Tanggal belum tersedia";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tanggal belum tersedia";
  }

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Landing() {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    setReports(null);
    setError("");

    api("/reports")
      .then((result) => {
        if (active) {
          setReports(result.data.slice(0, 3));
        }
      })
      .catch((error) => {
        if (active) {
          setError(error.message);
        }
      });

    return () => {
      active = false;
    };
  }, [retry]);

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
              onClick={(event) => {
                if (!localStorage.getItem("laporkuy_token")) {
                  event.preventDefault();
                  window.location.href = "/masuk";
                }
              }}
            >
              Buat Laporan
            </a>

            <a
              className="btn btn--outline btn--lg"
              href="/log"
              onClick={(event) => {
                if (!localStorage.getItem("laporkuy_token")) {
                  event.preventDefault();
                  window.location.href = "/masuk";
                } else {
                  event.preventDefault();
                  window.location.href = "/log";
                }
              }}
            >
              Laporan Saya
            </a>
          </div>
        </div>
      </section>

      <section className="search-block" aria-labelledby="search-title">
        <div className="container">
          <div className="search-card">
            <h2 className="visually-hidden" id="search-title">
              Cari laporan publik
            </h2>

            <form className="search-form" action="/laporan" method="get">
              <label className="visually-hidden" htmlFor="q">
                Kata kunci laporan atau lokasi
              </label>

              <input
                className="search-form__input"
                id="q"
                name="q"
                type="search"
                placeholder="Cari laporan atau lokasi…"
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
                Ringkasan yang telah diperiksa admin. Identitas pelapor
                tidak ditampilkan.
              </p>
            </div>

            <a className="btn btn--ghost" href="/laporan">
              Lihat semua
            </a>
          </div>

          {error && (
            <>
              <Notice error>{error}</Notice>

              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => setRetry((value) => value + 1)}
              >
                Coba lagi
              </button>
            </>
          )}

          {!reports && !error && (
            <Notice>Memuat laporan...</Notice>
          )}

          {reports?.length === 0 && (
            <Notice>Belum ada laporan yang dipublikasikan.</Notice>
          )}

          {reports?.length > 0 && (
            <ul className="report-list">
              {reports.map((report, index) => {
                const tone = STATUS_TONES[report.status] || "waiting";
                const description = report.description || "";
                const teaser =
                  description.length > 140
                    ? `${description.slice(0, 140)}…`
                    : description;

                return (
                  <li
                    className={`report-list__item${
                      index % 2 === 1 ? " report-list__item--right" : ""
                    }`}
                    key={report.ticket_number}
                    style={{ backgroundImage: `url(${reportImage})` }}
                  >
                    <a
                      className="report-list__link"
                      href={`/laporan/${encodeURIComponent(
                        report.ticket_number
                      )}`}
                    >
                      <div className="report-card" data-border="true">
                        <div className="report-card__header">
                          <span className="report-card__category">
                            {report.category || "Layanan publik"}
                          </span>

                          <time>
                            {formatDate(report.submitted_at)}
                          </time>
                        </div>

                        <div className="report-card__body">
                          <h3 className="report-card__title">
                            {report.title}
                          </h3>

                          <p className="report-card__teaser">
                            {teaser}
                          </p>

                          <p className="report-card__foot">
                            <span className={`status status--${tone}`}>
                              {STATUSES[report.status] || report.status}
                            </span>

                            <span>{report.ticket_number}</span>
                          </p>
                        </div>
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}