import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { StatusBadge, Progress, Notice, StatusSelect, Pager, dateText } from "../components/ReportWidgets.jsx";

export default function PublicReports({ ticket, staff = false }) {
  const cataloguePath = staff ? "/pemerintah/katalog" : "/laporan";
  const [query,setQuery] = useState(new URLSearchParams(location.search).get("q") || "");
  const [status,setStatus] = useState("");
  const [page,setPage] = useState(1);
  const [result,setResult] = useState(null);
  const [error,setError] = useState("");
  const [retry,setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setResult(null); setError("");
    const timer = setTimeout(() => {
      const path = ticket ? `/reports/${encodeURIComponent(ticket)}` : `/reports?${new URLSearchParams({ q: query, status, page })}`;
      api(path).then(r => { if (active) setResult(r); }).catch(e => { if (active) setError(e.message); });
    },200);
    return () => { active = false; clearTimeout(timer); };
  },[ticket,query,status,page,retry]);
  return <section className="lk-page container">
    <p className="lk-kicker">TRANSPARANSI LAYANAN PUBLIK</p>
    <div className="lk-title-row"><h1>{ticket ? "Detail laporan publik" : staff ? "Katalog publik" : "Katalog pengaduan"}</h1>{ticket ? <a className="btn btn--ghost" href={cataloguePath}>Kembali ke katalog</a> : !staff && <a className="btn btn--primary" href="/lapor">Buat laporan</a>}</div>
    <p className="lk-intro">Laporan yang diizinkan pelapor dan telah diperiksa admin. Identitas pelapor tidak ditampilkan.</p>
    {staff && !ticket && <div className="lk-staff__catalogue-note"><strong>Informasi yang terlihat oleh masyarakat</strong><p>Katalog ini menampilkan laporan publik dari seluruh dinas. Untuk menindaklanjuti laporan sesuai kewenanganmu, buka <a className="lk-text-link" href="/pemerintah/daftar">daftar laporan kerja</a>.</p></div>}
    {!ticket && <div className="lk-filters"><label>Cari laporan<input type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Judul, lokasi, atau nomor tiket" /></label><label htmlFor="status-filter">Status<StatusSelect value={status} onChange={v => { setStatus(v); setPage(1); }} /></label></div>}
    {error && <><Notice error>{error}</Notice><button className="btn btn--ghost" onClick={() => setRetry(retry + 1)}>Coba lagi</button></>}
    {!result && !error && <Notice>Memuat laporan...</Notice>}
    {result?.report && <article className="lk-panel"><div className="lk-title-row"><div><p className="lk-kicker">{result.report.ticket_number}</p><h2>{result.report.title}</h2></div><StatusBadge status={result.report.status} /></div><p className="lk-muted">{result.report.location || "Lokasi umum tidak dicantumkan"} · {dateText(result.report.submitted_at)}</p><p className="lk-muted">{result.report.dinas_name || "Menunggu penetapan dinas"}</p><Progress value={result.report.progress_percent} /><p className="lk-body-text">{result.report.description}</p></article>}
    {result?.data?.length === 0 && <Notice>Tidak ada laporan publik yang cocok. Coba kata kunci atau status lain.</Notice>}
    {result?.data?.length > 0 && <><p className="lk-result-count">{result.total} laporan ditemukan</p><div className="lk-cards">{result.data.map(r => <article className="lk-card" key={r.ticket_number}><div className="lk-title-row"><span className="lk-kicker">{r.ticket_number}</span><StatusBadge status={r.status} /></div><h2><a href={`${cataloguePath}/${encodeURIComponent(r.ticket_number)}`}>{r.title}</a></h2><p className="lk-muted">{r.location || "Lokasi tidak dipublikasikan"}</p><p>{r.description?.slice(0,180)}{r.description?.length > 180 ? "…" : ""}</p><Progress value={r.progress_percent} /><a className="lk-text-link" href={`${cataloguePath}/${encodeURIComponent(r.ticket_number)}`}>Baca selengkapnya →</a></article>)}</div><Pager page={page} total={result.total} onPage={setPage} /></>}
  </section>;
}
