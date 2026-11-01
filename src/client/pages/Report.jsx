import { useEffect, useState } from "react";
import { api, loginURL } from "../lib/api.js";
import { StatusBadge, Progress, Notice, parseReport, dateText } from "../components/ReportWidgets.jsx";

export default function Report() {
  const logView = location.pathname.replace(/\/+$/, "") === "/log";
  const [user,setUser] = useState(null);
  const [ready,setReady] = useState(false);
  const [error,setError] = useState("");
  const [logs,setLogs] = useState(null);
  const [busy,setBusy] = useState(false);
  const [uploading,setUploading] = useState(false);
  const [photoError,setPhotoError] = useState("");
  const [image,setImage] = useState("");
  const [receipt,setReceipt] = useState(null);
  const [retry,setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setError("");
    api("/auth/me").then(r => { if(active) setUser(r.user); return logView ? api("/log") : null; })
      .then(r => { if(active && r) setLogs(r.data); })
      .catch(e => { if(active) setError(e.message); })
      .finally(() => { if(active) setReady(true); });
    return () => { active = false; };
  },[logView,retry]);
  async function upload(event) {
    const file = event.target.files?.[0];
    setImage(""); setPhotoError("");
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData(); data.append("file",file);
      const r = await fetch("/api/upload-image",{ method:"POST",headers:{ Authorization:`Bearer ${localStorage.getItem("laporkuy_token")}` },body:data });
      const json = await r.json(); if(!r.ok) throw new Error(json.error);
      setImage(json.image_url);
    } catch(e) { setPhotoError(e.message || "Foto gagal diunggah. Coba kembali."); }
    finally { setUploading(false); }
  }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const r = await api("/submit-laporan",{ method:"POST",body:JSON.stringify({
        description_raw:`${data.get("title").trim()}\nLokasi: ${data.get("location").trim()}\n\n${data.get("description").trim()}`,
        image_url:image || null,is_public:data.get("is_public") === "on",
      }) });
      setReceipt(r.report);
    } catch(e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <div className="report-layout lk-report-layout"><aside className="report-sidebar lk-report-nav"><h2>Menu laporan</h2><a aria-current={!logView ? "page" : undefined} href="/lapor">Buat laporan</a><a aria-current={logView ? "page" : undefined} href="/log">Riwayat laporan</a>{["admin","pemerintah"].includes(user?.role) && (<a href="/pemerintah">Dashboard pemerintah</a>)}</aside>
    <section className="report-canvas"><header className="report-canvas__head"><h1 className="report-canvas__title">{logView ? "Riwayat laporan" : "Buat laporan"}</h1><p className="report-canvas__sub">{logView ? "Pantau laporan yang kamu kirim dan tanggapan dari petugas." : "Ceritakan masalah infrastruktur, layanan, atau program pemerintah yang perlu ditindaklanjuti."}</p></header>
      {!ready && <Notice>Memeriksa akun...</Notice>}
      {error && <Notice error>{error} {user && <button className="lk-inline-button" onClick={() => setRetry(retry + 1)}>Coba lagi</button>}</Notice>}
      {ready && !user && <Notice>Masuk terlebih dahulu untuk membuat atau melihat laporan. <a className="lk-text-link" href={loginURL()}>Masuk →</a></Notice>}
      {ready && user && (logView ? <>{logs?.length === 0 && <Notice>Belum ada laporan. <a className="lk-text-link" href="/lapor">Buat laporan pertama →</a></Notice>}<div className="lk-personal-list">{logs?.map(r => <article className="lk-card" key={r.id}><div className="lk-title-row"><strong>{r.ticket_number}</strong><StatusBadge status={r.status} /></div><h2>{parseReport(r.description_raw).title}</h2><p className="lk-muted">{dateText(r.submitted_at)}</p><Progress value={r.progress_percent} /><a className="lk-text-link" href={`/lacak?tiket=${r.ticket_number}`}>Lihat detail dan tanggapan →</a></article>)}</div></> : receipt ? <div className="lk-panel"><h2>Laporan berhasil dikirim</h2><p className="lk-body-text">Simpan nomor tiket berikut untuk memantau penanganannya.</p><p className="lk-receipt">{receipt.ticket_number}</p><div className="lk-actions"><a className="btn btn--primary" href={`/lacak?tiket=${receipt.ticket_number}`}>Lacak laporan ini</a><a className="btn btn--ghost" href="/log">Lihat riwayat</a><button className="btn btn--ghost" onClick={() => { setReceipt(null); setImage(""); setPhotoError(""); }}>Buat laporan lain</button></div></div> : <form className="report-form" onSubmit={submit}>
        <div className="report-field"><label className="report-label" htmlFor="report-title">Judul</label><input className="report-input" id="report-title" name="title" required maxLength={200} placeholder="Contoh: Jalan berlubang di Jl. Soekarno Hatta" /></div>
        <div className="report-field"><label className="report-label" htmlFor="report-location">Lokasi</label><textarea className="report-input" id="report-location" name="location" required maxLength={500} rows={2} placeholder="Alamat atau titik lokasi kejadian" /></div>
        <div className="report-field"><label className="report-label" htmlFor="report-description">Deskripsi</label><textarea className="report-input" id="report-description" name="description" required minLength={10} maxLength={10000} rows={5} placeholder="Jelaskan kejadian, dampak, dan saran perbaikannya." /></div>
        <div className="report-field"><label className="report-label" htmlFor="report-photo">Foto (opsional, PNG/JPG/WebP, maksimal 5 MB)</label><input className="report-input" id="report-photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} />{uploading && <Notice>Mengunggah foto...</Notice>}{photoError && <Notice error>{photoError}</Notice>}{image && <><img className="report-photo__preview" src={image} alt="Pratinjau foto bukti" /><button type="button" className="lk-inline-button" onClick={() => { setImage(""); document.getElementById("report-photo").value = ""; }}>Hapus foto dari laporan</button></>}</div>
        <label className="lk-checkbox"><input type="checkbox" name="is_public" /> Saya mengizinkan ringkasan laporan dipublikasikan setelah diperiksa admin. Identitas dan foto tidak ditampilkan di katalog.</label>
        <button className="btn btn--primary report-submit" disabled={busy || uploading}>{busy ? "Mengirim..." : "Kirim laporan"}</button>
      </form>)}
    </section></div>;
}
