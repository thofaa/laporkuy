import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Notice, PrivateReport, StatusBadge, StatusSelect, Pager, dateText, parseReport, SYSTEM_STATUSES } from "../components/ReportWidgets.jsx";
import GovernmentCharts from "../components/GovernmentCharts.jsx";

function GovernmentDetail({ id, user, onSaved }) {
  const [result,setResult] = useState(null);
  const [form,setForm] = useState({});
  const [dinasList,setDinasList] = useState([]);
  const [error,setError] = useState("");
  const [success,setSuccess] = useState("");
  const [busy,setBusy] = useState(false);
  const [feedbackBusy,setFeedbackBusy] = useState(false);
  const [tab,setTab] = useState("history");
  const [retry,setRetry] = useState(0);
  const admin = user.role === "admin";
  function apply(r) {
    setResult(r);
    setForm({ status: SYSTEM_STATUSES.includes(r.report.status) ? "accepted" : r.report.status, progress_percent: r.report.progress_percent, note: "", dinas_id: r.report.dinas_id || "",
      moderation_status: r.report.moderation_status === "published" ? "published" : "held",
      public_title: r.report.public_title || "", public_location: r.report.public_location || "",
      description_redacted: r.report.description_redacted || "", expected_updated_at: r.report.updated_at || r.report.submitted_at });
  }
  useEffect(() => {
    let active = true; setError(""); setResult(null);
    api(`/government/reports/${id}`).then(r => {
      if (active) apply(r);
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  },[id,retry]);
  useEffect(() => {
    if (!admin) return;
    let active = true;
    api("/government/dinas").then(r => { if (active) setDinasList(r.data); }).catch(() => {});
    return () => { active = false; };
  },[admin,id]);
  const change = (name,value) => setForm(f => ({ ...f,[name]: value }));
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      const r = await api(`/government/reports/${id}`, { method:"PATCH", body: JSON.stringify(form) });
      apply(r); setSuccess("Tanggapan dan progres berhasil disimpan. Pelapor dapat melihatnya pada halaman riwayat laporan."); onSaved();
    } catch(e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function postFeedback(message) {
    setFeedbackBusy(true);
    try {
      const r = await api(`/government/reports/${id}/feedbacks`, { method:"POST", body: JSON.stringify({ message }) });
      setResult(prev => ({ ...prev, feedbacks: r.feedbacks }));
    } finally { setFeedbackBusy(false); }
  }
  async function assignDinas(event) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      const r = await api(`/government/reports/${id}/assign-dinas`, { method:"POST", body: JSON.stringify({ dinas_id: form.dinas_id || null }) });
      apply(r); setSuccess("Dinas tujuan diperbarui. Laporan langsung tampil di dashboard dinas terkait."); onSaved();
    } catch(e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <><div className="lk-detail-topbar">
    <a className="lk-text-link" href="/pemerintah/daftar">← Kembali ke daftar laporan</a>
  </div>
    {error && <Notice error>{error} <button type="button" className="lk-inline-button" onClick={() => setRetry(retry + 1)}>Muat ulang detail</button></Notice>}
    {!result && !error && <Notice>Memuat detail...</Notice>}
    {result && <div className="lk-detail-layout lk-detail-layout--wide"><article className="lk-panel">
      <PrivateReport report={result.report} history={result.history} followUp={!admin && <form className="lk-edit-form lk-follow-up" id="tindak-lanjut" onSubmit={save}>
        <h3>Tindak Lanjut Laporan</h3>
        {success && <Notice>{success}</Notice>}
        <label htmlFor="update-status">Status<StatusSelect id="update-status" all={false} value={form.status} onChange={v => setForm(f => ({ ...f,status:v,progress_percent:v === "resolved" ? 100 : Math.min(99,Number(f.progress_percent)) }))} /></label>
        <label>Progres (%)<input name="progress_percent" type="number" min="0" max="100" required value={form.progress_percent} onChange={e => change("progress_percent",e.target.value)} /></label>
        <label>Tanggapan untuk pelapor<textarea name="note" rows={5} required maxLength={3000} value={form.note} onChange={e => change("note",e.target.value)} placeholder="Jelaskan tindakan yang sudah dilakukan dan langkah berikutnya." /></label>
        <button className="btn btn--primary" disabled={busy}>{busy ? "Menyimpan..." : "Simpan tanggapan"}</button>
        </form>} feedbacks={result.feedbacks} onFeedback={postFeedback} feedbackBusy={feedbackBusy} tab={tab} onTab={setTab} />
      {admin && <form className="lk-edit-form lk-follow-up" onSubmit={assignDinas}>
        <h3>Penetapan Dinas Tujuan</h3>
        {success && <Notice>{success}</Notice>}
        <label htmlFor="dinas-assign">Dinas tujuan<select id="dinas-assign" value={form.dinas_id} onChange={e => change("dinas_id", e.target.value)}><option value="">Belum ditetapkan</option>{dinasList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
        <button className="btn btn--primary" disabled={busy}>{busy ? "Menyimpan..." : "Simpan dinas"}</button>
      </form>}
    </article></div>}
  </>;
}

export default function Government({ id, user, view = "dashboard" }) {
  const [error,setError] = useState("");
  const [query,setQuery] = useState("");
  const [status,setStatus] = useState("");
  const [result,setResult] = useState(null);
  const [page,setPage] = useState(1);
  const [retry,setRetry] = useState(0);
  const admin = user?.role === "admin";
  const review = view === "review";
  const listStatus = review ? "needs_review" : status;
  useEffect(() => {
    if (!user || !["admin","pemerintah"].includes(user.role) || id) return;
    let active = true; setResult(null); setError("");
    const timer = setTimeout(() => {
      api(`/government/reports?${new URLSearchParams({ q:query,status:listStatus,page })}`).then(r => { if(active) setResult(r); }).catch(e => { if(active) setError(e.message); });
    },200);
    return () => { active = false; clearTimeout(timer); };
  },[user,id,query,listStatus,page,retry]);
  const permitted = ["admin","pemerintah"].includes(user?.role);
  const title = id ? "Detail pengaduan" : review ? "Tinjau Laporan" : view === "reports" ? (admin ? "Kelola Laporan" : "Laporan dinas") : "Dashboard";
  return <section className="lk-page container"><div className="lk-title-row"><h1>{title}</h1>{/* Katalog publik di-comment sementara. <a className="btn btn--ghost" href="/pemerintah/katalog">Lihat katalog publik</a> */}</div>
      {permitted && (id ? <GovernmentDetail id={id} user={user} onSaved={() => {}} /> : <>
      {review && !admin && <Notice error>Halaman ini khusus admin.</Notice>}
      {view === "dashboard" && <GovernmentCharts />}
      {result && view === "dashboard" && <div className="lk-stats">{[["Total laporan",result.summary.total],["Menunggu tindak lanjut",result.summary.waiting],["Sedang ditangani",result.summary.active],["Selesai",result.summary.resolved]].map(([label,value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}
      {view !== "dashboard" && <>
        {!review && user.role === "pemerintah" && <p className="lk-intro">Daftar ini hanya menampilkan laporan yang ditugaskan kepada dinasmu.</p>}
        <div className="lk-filters"><label>Cari laporan<input type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Nomor tiket, judul, atau lokasi" /></label>{!review && <label htmlFor="status-filter">Status<StatusSelect value={status} onChange={v => { setStatus(v); setPage(1); }} /></label>}</div>
        {error && <Notice error>{error} <button className="lk-inline-button" onClick={() => setRetry(retry + 1)}>Coba lagi</button></Notice>}
        {!result && !error && <Notice>Memuat laporan...</Notice>}
        {result?.data.length === 0 && <Notice>Belum ada laporan yang sesuai dengan pencarian ini.</Notice>}
        {result?.data.length > 0 && <><div className="lk-table-wrap"><table className="lk-table"><caption className="visually-hidden">Daftar pengaduan yang dapat ditangani</caption><thead><tr><th>Tiket / tanggal</th><th>Laporan</th><th>Status</th><th>Progres</th><th>Tindakan</th></tr></thead><tbody>{result.data.map(r => <tr key={r.id}><td data-label="Tiket / tanggal"><strong>{r.ticket_number}</strong><small>{dateText(r.submitted_at)}</small></td><td data-label="Laporan"><strong>{parseReport(r.description_raw).title}</strong><small>{r.dinas_name || "Belum ditetapkan dinas"}</small></td><td data-label="Status"><StatusBadge status={r.status} /></td><td data-label="Progres">{r.progress_percent}%</td><td data-label="Tindakan"><a className="btn btn--ghost" href={`/pemerintah/laporan/${r.id}`}>Tinjau</a></td></tr>)}</tbody></table></div><Pager page={page} total={result.total} onPage={setPage} /></>}
      </>}
    </>)}
  </section>;
}
