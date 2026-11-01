import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { StatusBadge, Progress, Notice, PrivateReport, parseReport, dateText } from "../components/ReportWidgets.jsx";
import MapView from "../components/MapView.jsx";

export function PersonalReport({ id }) {
  const [state, setState] = useState({ status: "loading" });
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [tab, setTab] = useState("history");
  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    api(`/log/${id}`).then(r => { if (active) setState({ status: "ok", ...r }); })
      .catch(e => { if (active) setState({ status: "error", error: e.message }); });
    return () => { active = false; };
  }, [id, retry]);
  async function respond(action) {
    setBusy(action); setActionError("");
    try {
      const r = await api(`/log/${id}/resolution`, { method: "POST", body: JSON.stringify({ action }) });
      setState(s => ({ ...s, report: r.report, history: r.history }));
    } catch (e) { setActionError(e.message); }
    finally { setBusy(""); }
  }
  async function postFeedback(message) {
    setFeedbackBusy(true);
    try {
      const r = await api(`/log/${id}/feedbacks`, { method: "POST", body: JSON.stringify({ message }) });
      setState(s => ({ ...s, feedbacks: r.feedbacks }));
    } finally { setFeedbackBusy(false); }
  }
  const pending = state.status === "ok" && state.report?.resolution_requested_at && state.report.status === "resolved";
  return <>
    <div className="lk-detail-topbar">
      <a className="lk-text-link" href="/log">← Kembali ke riwayat</a>
    </div>
    {state.status === "loading" && <Notice>Memuat detail...</Notice>}
    {state.status === "error" && <Notice error>{state.error} <button className="lk-inline-button" onClick={() => setRetry(retry + 1)}>Coba lagi</button></Notice>}
    {pending && <section className="lk-resolution-request" aria-labelledby="resolution-title">
      <h2 id="resolution-title">Instansi menandai laporan selesai</h2>
      <p>{state.report.resolution_request_note || "Pihak instansi menyatakan penanganan selesai. Setujui jika sudah sesuai, atau tolak agar laporan ditangani kembali."}</p>
      {actionError && <Notice error>{actionError}</Notice>}
      <div className="lk-actions">
        <button type="button" className="btn btn--primary" disabled={Boolean(busy)} onClick={() => respond("approve")}>{busy === "approve" ? "Menyetujui..." : "Setujui selesai"}</button>
        <button type="button" className="btn btn--ghost" disabled={Boolean(busy)} onClick={() => respond("reject")}>{busy === "reject" ? "Menolak..." : "Tolak"}</button>
      </div>
    </section>}
    {state.status === "ok" && <div className="lk-detail-layout lk-detail-layout--wide"><article className="lk-panel"><PrivateReport report={state.report} history={state.history} feedbacks={state.feedbacks} onFeedback={postFeedback} feedbackBusy={feedbackBusy} tab={tab} onTab={setTab} /></article></div>}
  </>;
}

export default function Report({ user }) {
  const logView = location.pathname.replace(/\/+$/, "") === "/log";
  const [error, setError] = useState("");
  const [logs, setLogs] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [image, setImage] = useState("");
  const [point, setPoint] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!logView) return;
    let active = true;
    api("/log").then(r => { if (active) setLogs(r.data); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [logView, retry]);

  async function upload(event) {
    const file = event.target.files?.[0];
    setImage(""); setPhotoError("");
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData(); data.append("file", file);
      const r = await fetch("/api/upload-image", { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("laporkuy_token")}` }, body: data });
      const json = await r.json(); if (!r.ok) throw new Error(json.error);
      setImage(json.image_url);
    } catch (e) { setPhotoError(e.message || "Foto gagal diunggah. Coba kembali."); }
    finally { setUploading(false); }
  }

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    if (!point) { setError("Pilih titik lokasi di peta terlebih dahulu."); setBusy(false); return; }
    try {
      const r = await api("/submit-laporan", { method: "POST", body: JSON.stringify({
        description_raw: `${data.get("title").trim()}\nLokasi: ${data.get("location").trim()}\n\n${data.get("description").trim()}`,
        image_url: image || null, is_public: data.get("is_public") === "on",
        lat: point.lat, lng: point.lng, address: point.label || null,
      }) });
      setReceipt(r.report);
      setPoint(null);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  if (logView) {
    return <>
      <header className="report-canvas__head"><h1 className="report-canvas__title">Riwayat laporan</h1><p className="report-canvas__sub">Pantau laporan yang kamu kirim dan tanggapan dari petugas.</p></header>
      {error && <Notice error>{error} <button className="lk-inline-button" onClick={() => setRetry(retry + 1)}>Coba lagi</button></Notice>}
      {logs === null && !error && <Notice>Memuat riwayat...</Notice>}
      {logs?.length === 0 && <Notice>Belum ada laporan. <a className="lk-text-link" href="/lapor">Buat laporan pertama →</a></Notice>}
      <div className="lk-personal-list">{logs?.map(r => <article className="lk-card" key={r.id}><div className="lk-title-row"><strong>{r.ticket_number}</strong><StatusBadge status={r.status} /></div><h2>{parseReport(r.description_raw).title}</h2><p className="lk-muted">{dateText(r.submitted_at)}</p><Progress value={r.progress_percent} />{r.resolution_requested_at && r.status === "resolved" && <p className="lk-resolution-hint">Instansi menandai selesai — tinjau dan beri keputusan.</p>}<a className="lk-text-link" href={`/log/laporan/${r.id}`}>Lihat detail dan tanggapan →</a></article>)}</div>
    </>;
  }

  if (receipt) {
    return <div className="lk-panel"><h2>Laporan berhasil dikirim</h2><p className="lk-body-text">Simpan nomor tiket berikut untuk memantau penanganannya.</p><p className="lk-receipt">{receipt.ticket_number}</p><div className="lk-actions"><a className="btn btn--primary" href={`/log/laporan/${receipt.id}`}>Lihat detail laporan</a><a className="btn btn--ghost" href="/log">Lihat riwayat</a><button className="btn btn--ghost" onClick={() => { setReceipt(null); setImage(""); setPhotoError(""); setPoint(null); }}>Buat laporan lain</button></div></div>;
  }

  return <>
    <header className="report-canvas__head"><h1 className="report-canvas__title">Buat laporan</h1><p className="report-canvas__sub">Ceritakan masalah infrastruktur, layanan, atau program pemerintah yang perlu ditindaklanjuti.</p></header>
    <form className="report-form" onSubmit={submit}>
      <div className="report-field"><label className="report-label" htmlFor="report-title">Judul</label><input className="report-input" id="report-title" name="title" required maxLength={200} placeholder="Contoh: Jalan berlubang di Jl. Soekarno Hatta" /></div>
      <div className="report-field"><label className="report-label" htmlFor="report-location">Lokasi</label><textarea className="report-input" id="report-location" name="location" required maxLength={500} rows={2} placeholder="Alamat atau titik lokasi kejadian" /></div>
      <div className="report-field"><label className="report-label" htmlFor="report-description">Deskripsi</label><textarea className="report-input" id="report-description" name="description" required minLength={10} maxLength={10000} rows={5} placeholder="Jelaskan kejadian, dampak, dan saran perbaikannya." /></div>
      <div className="report-field"><label className="report-label" htmlFor="report-photo">Foto (opsional, PNG/JPG/WebP, maksimal 5 MB)</label><input className="report-input" id="report-photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} />{uploading && <Notice>Mengunggah foto...</Notice>}{photoError && <Notice error>{photoError}</Notice>}{image && <><img className="report-photo__preview" src={image} alt="Pratinjau foto bukti" /><button type="button" className="lk-inline-button" onClick={() => { setImage(""); document.getElementById("report-photo").value = ""; }}>Hapus foto dari laporan</button></>}</div>
      <div className="report-field"><span className="report-label">Titik lokasi</span><MapView value={point} onChange={setPoint} />{point?.label && <p className="report-map__address">{point.label}</p>}</div>
      <label className="lk-checkbox"><input type="checkbox" name="is_public" /> Saya mengizinkan ringkasan laporan dipublikasikan setelah diperiksa admin. Identitas dan foto tidak ditampilkan di katalog.</label>
      {error && <Notice error>{error}</Notice>}
      <button className="btn btn--primary report-submit" disabled={busy || uploading || !point}>{busy ? "Mengirim..." : "Kirim laporan"}</button>
    </form>
  </>;
}