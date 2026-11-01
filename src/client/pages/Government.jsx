import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Notice, PrivateReport, StatusBadge, StatusSelect, Pager, dateText, parseReport } from "../components/ReportWidgets.jsx";

function GovernmentDetail({ id, user, onSaved }) {
  const [result,setResult] = useState(null);
  const [dinas,setDinas] = useState([]);
  const [form,setForm] = useState({});
  const [error,setError] = useState("");
  const [success,setSuccess] = useState("");
  const [busy,setBusy] = useState(false);
  const [retry,setRetry] = useState(0);
  const admin = user.role === "admin";
  function apply(r) {
    setResult(r);
    setForm({ status: r.report.status, progress_percent: r.report.progress_percent, note: "", dinas_id: r.report.dinas_id || "",
      moderation_status: r.report.moderation_status === "published" ? "published" : "held",
      public_title: r.report.public_title || "", public_location: r.report.public_location || "",
      description_redacted: r.report.description_redacted || "", expected_updated_at: r.report.updated_at || r.report.submitted_at });
  }
  useEffect(() => {
    let active = true; setError(""); setResult(null);
    Promise.all([api(`/government/reports/${id}`),api("/government/dinas")]).then(([r,d]) => {
      if (active) { apply(r); setDinas(d.data); }
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  },[id,retry]);
  const change = (name,value) => setForm(f => ({ ...f,[name]: value }));
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      const r = await api(`/government/reports/${id}`, { method:"PATCH", body: JSON.stringify(form) });
      apply(r); setSuccess("Tanggapan dan progres berhasil disimpan. Pelapor dapat melihatnya pada halaman pelacakan."); onSaved();
    } catch(e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <><a className="lk-text-link" href="/pemerintah/daftar">← Kembali ke daftar laporan</a>
    {error && <Notice error>{error} <button type="button" className="lk-inline-button" onClick={() => setRetry(retry + 1)}>Muat ulang detail</button></Notice>}
    {!result && !error && <Notice>Memuat detail...</Notice>}
    {result && <div className="lk-detail-layout"><article className="lk-panel"><PrivateReport report={result.report} history={result.history} /></article>
      <form className="lk-panel lk-edit-form" onSubmit={save}><h2>Tindak lanjut laporan</h2>
        {success && <Notice>{success}</Notice>}
        <label htmlFor="update-status">Status<StatusSelect id="update-status" all={false} value={form.status} onChange={v => setForm(f => ({ ...f,status:v,progress_percent:v === "resolved" ? 100 : v === "rejected" ? 0 : Math.min(99,Number(f.progress_percent)) }))} /></label>
        <label>Progres (%)<input name="progress_percent" type="number" min="0" max="100" required value={form.progress_percent} onChange={e => change("progress_percent",e.target.value)} /></label>
        {admin && <label>Dinas penanggung jawab<select value={form.dinas_id} onChange={e => change("dinas_id",e.target.value)}><option value="">Belum ditetapkan</option>{dinas.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>}
        <label>Tanggapan untuk pelapor<textarea name="note" rows={5} required maxLength={3000} value={form.note} onChange={e => change("note",e.target.value)} placeholder="Jelaskan tindakan yang sudah dilakukan dan langkah berikutnya." /></label>
        {admin && <fieldset><legend>Publikasi katalog</legend><p className="lk-muted">{result.report.is_public ? "Pelapor mengizinkan publikasi. Tulis ringkasan yang aman; hapus nama, nomor kontak, dan alamat pribadi." : "Pelapor tidak mengizinkan publikasi. Laporan tetap ditangani secara pribadi."}</p>
          <label className="lk-checkbox"><input type="checkbox" disabled={!result.report.is_public} checked={form.moderation_status === "published"} onChange={e => change("moderation_status",e.target.checked ? "published" : "held")} /> Tampilkan pada katalog publik</label>
          {result.report.is_public && <><label>Judul publik<input maxLength={200} value={form.public_title} required={form.moderation_status === "published"} onChange={e => change("public_title",e.target.value)} /></label><label>Lokasi umum untuk publik<input maxLength={500} value={form.public_location} onChange={e => change("public_location",e.target.value)} placeholder="Kelurahan atau kecamatan" /></label><label>Deskripsi publik<textarea rows={4} maxLength={12000} required={form.moderation_status === "published"} value={form.description_redacted} onChange={e => change("description_redacted",e.target.value)} /></label></>}
        </fieldset>}
        <button className="btn btn--primary" disabled={busy}>{busy ? "Menyimpan..." : "Simpan tanggapan"}</button>
      </form></div>}
  </>;
}

export default function Government({ id, user, view = "dashboard" }) {
  const [error,setError] = useState("");
  const [query,setQuery] = useState("");
  const [status,setStatus] = useState("");
  const [result,setResult] = useState(null);
  const [page,setPage] = useState(1);
  const [retry,setRetry] = useState(0);
  useEffect(() => {
    if (!user || !["admin","pemerintah"].includes(user.role) || id) return;
    let active = true; setResult(null); setError("");
    const timer = setTimeout(() => {
      api(`/government/reports?${new URLSearchParams({ q:query,status,page })}`).then(r => { if(active) setResult(r); }).catch(e => { if(active) setError(e.message); });
    },200);
    return () => { active = false; clearTimeout(timer); };
  },[user,id,query,status,page,retry]);
  const permitted = ["admin","pemerintah"].includes(user?.role);
  return <section className="lk-page container"><p className="lk-kicker">RUANG KERJA PEMERINTAH</p><div className="lk-title-row"><h1>{id ? "Detail pengaduan" : view === "reports" ? (user.role === "admin" ? "Kelola laporan" : "Laporan dinas") : (user.role === "admin" ? "Dashboard pemerintah" : "Dashboard dinas")}</h1><a className="btn btn--ghost" href="/pemerintah/katalog">Lihat katalog publik</a></div>
    {permitted && (id ? <GovernmentDetail id={id} user={user} onSaved={() => {}} /> : <>
      <p className="lk-intro">{user.role === "admin" ? "Tinjau laporan masuk, tentukan dinas tujuan, dan pantau tindak lanjut." : "Daftar ini hanya menampilkan laporan yang ditugaskan kepada dinasmu."}</p>
      {result && view === "dashboard" && <div className="lk-stats">{[["Total laporan",result.summary.total],["Menunggu tindak lanjut",result.summary.waiting],["Sedang ditangani",result.summary.active],["Selesai",result.summary.resolved]].map(([label,value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}
      <div className="lk-filters"><label>Cari laporan<input type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Nomor tiket, judul, atau lokasi" /></label><label htmlFor="status-filter">Status<StatusSelect value={status} onChange={v => { setStatus(v); setPage(1); }} /></label></div>
      {error && <Notice error>{error} <button className="lk-inline-button" onClick={() => setRetry(retry + 1)}>Coba lagi</button></Notice>}
      {!result && !error && <Notice>Memuat laporan...</Notice>}
      {result?.data.length === 0 && <Notice>Belum ada laporan yang sesuai dengan pencarian ini.</Notice>}
      {result?.data.length > 0 && <><div className="lk-table-wrap"><table className="lk-table"><caption className="visually-hidden">Daftar pengaduan yang dapat ditangani</caption><thead><tr><th>Tiket / tanggal</th><th>Laporan</th><th>Status</th><th>Progres</th><th>Tindakan</th></tr></thead><tbody>{result.data.map(r => <tr key={r.id}><td data-label="Tiket / tanggal"><strong>{r.ticket_number}</strong><small>{dateText(r.submitted_at)}</small></td><td data-label="Laporan"><strong>{parseReport(r.description_raw).title}</strong><small>{r.dinas_name || "Belum ditetapkan dinas"}</small></td><td data-label="Status"><StatusBadge status={r.status} /></td><td data-label="Progres">{r.progress_percent}%</td><td data-label="Tindakan"><a className="btn btn--ghost" href={`/pemerintah/laporan/${r.id}`}>Tinjau</a></td></tr>)}</tbody></table></div><Pager page={page} total={result.total} onPage={setPage} /></>}
    </>)}
  </section>;
}
