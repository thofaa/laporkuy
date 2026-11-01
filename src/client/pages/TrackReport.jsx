import { useEffect, useState } from "react";
import { api, loginURL } from "../lib/api.js";
import {
  Notice,
  PrivateReport,
  StatusBadge,
  Progress,
  parseReport,
  dateText,
} from "../components/ReportWidgets.jsx";

export default function TrackReport() {
  const [search, setSearch] = useState("");
  const ticket = (
    new URLSearchParams(window.location.search).get("tiket") || ""
  ).trim().toUpperCase();

  const [reports, setReports] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needLogin, setNeedLogin] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      setLoading(true);
      setError("");
      setNeedLogin(false);
      setDetail(null);
      setReports([]);

      try {
        // API ini hanya mengembalikan laporan milik akun yang login.
        const result = await api("/log");

        if (!active) return;

        setReports(result.data);

        // Tautan dari riwayat langsung membuka detail tanpa pencarian.
        if (ticket) {
          const ownReport = result.data.find(
            (report) => report.ticket_number.toUpperCase() === ticket
          );

          if (!ownReport) {
            throw new Error("Laporan ini tidak ditemukan pada akunmu.");
          }

          const reportDetail = await api(
            `/track/${encodeURIComponent(ticket)}`
          );

          if (active) {
            setDetail(reportDetail);
          }
        }
      } catch (error) {
        if (active) {
          setError(error.message);
          setNeedLogin(error.status === 401);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      active = false;
    };
  }, [ticket, retry]);

  const keyword = search.trim().toLowerCase();

  const filteredReports = reports.filter((report) => {
    const content = parseReport(report.description_raw);
  
    return [
      report.ticket_number,
      content.title,
      content.location,
      content.description,
    ].some((value) =>
      String(value ?? "").toLowerCase().includes(keyword)
    );
  });

  return (
    <section className="lk-page container">
      <p className="lk-kicker">PANTAU TINDAK LANJUT</p>

      <div className="lk-title-row">
        <h1>{ticket ? "Detail laporan saya" : "Laporan saya"}</h1>

        {ticket ? (
          <a className="btn btn--ghost" href="/lacak">
            Kembali ke laporan saya
          </a>
        ) : (
          <a className="btn btn--primary" href="/lapor">
            Buat laporan
          </a>
        )}
      </div>

      <p className="lk-intro">
        {ticket
          ? "Lihat perkembangan penanganan dan tanggapan petugas."
          : "Semua laporan yang kamu kirim tampil di sini. Pilih laporan untuk melihat detail dan tanggapan petugas."}
      </p>

      {loading && <Notice>Memuat laporanmu...</Notice>}

      {!loading && error && (
        <>
          <Notice error>{error}</Notice>

          {needLogin ? (
            <a className="btn btn--primary" href={loginURL()}>
              Masuk untuk melihat laporan
            </a>
          ) : (
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => setRetry((value) => value + 1)}
            >
              Coba lagi
            </button>
          )}
        </>
      )}

      {!loading && !error && !ticket && (
        <>
          {reports.length === 0 ? (
            <Notice>
              Kamu belum mengirim laporan. Laporan yang kamu kirim nanti
              akan muncul di sini.
            </Notice>
          ) : (
            <>
              <div className="lk-track-form">
                <label htmlFor="search-my-reports">
                  Cari dalam laporan saya
                </label>
          
                <div>
                  <input
                    id="search-my-reports"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari judul, lokasi, atau nomor tiket…"
                    autoComplete="off"
                  />

                  {search && (
                    <button
                      className="btn btn--ghost"
                      type="button"
                      onClick={() => setSearch("")}
                    >
                      Hapus pencarian
                    </button>
                  )}
                </div>
              </div>
                
              <p className="lk-result-count" role="status">
                {keyword
                  ? `${filteredReports.length} dari ${reports.length} laporan cocok.`
                  : `Kamu memiliki ${reports.length} laporan.`}
              </p>
                
              {filteredReports.length === 0 ? (
                <Notice>
                  Tidak ada laporan yang cocok. Coba kata kunci lain
                  atau hapus pencarian untuk melihat semua laporan.
                </Notice>
              ) : (
                <div className="lk-personal-list">
                  {filteredReports.map((report) => {
                    const content = parseReport(report.description_raw);
                  
                    return (
                      <article className="lk-card" key={report.id}>
                        <div className="lk-title-row">
                          <span className="lk-kicker">
                            {report.ticket_number}
                          </span>
                    
                          <StatusBadge status={report.status} />
                        </div>
                    
                        <h2>{content.title}</h2>
                    
                        {content.location && (
                          <p className="lk-muted">{content.location}</p>
                        )}

                        <p className="lk-muted">
                          Dikirim pada {dateText(report.submitted_at)}
                        </p>
                      
                        <Progress value={report.progress_percent} />
                      
                        <a
                          className="lk-text-link"
                          href={`/lacak?tiket=${encodeURIComponent(
                            report.ticket_number
                          )}`}
                        >
                          Lihat detail dan tanggapan →
                        </a>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {!loading && !error && detail && (
        <article className="lk-panel">
          <PrivateReport
            report={detail.report}
            history={detail.history}
          />
        </article>
      )}
    </section>
  );
}