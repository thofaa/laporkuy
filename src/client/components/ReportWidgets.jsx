import { useState } from "react";
import { STATUSES, SYSTEM_STATUSES, parseReport } from "../../shared/reports.js";
export { STATUSES, SYSTEM_STATUSES, parseReport };
import { MapPin } from "./MapView.jsx";
export const dateText = value => new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
export function StatusBadge({ status }) {
  return <span className={`lk-badge lk-badge--${status}`}>{STATUSES[status] || status}</span>;
}
export function Progress({ value = 0 }) {
  return <div className="lk-progress"><div className="lk-progress__label"><span>Progres penanganan</span><strong>{value}%</strong></div><progress max="100" value={value} aria-label="Progres penanganan" /></div>;
}
export function Notice({ children, error = false }) {
  return <p className={`lk-notice${error ? " lk-notice--error" : ""}`} role={error ? "alert" : "status"}>{children}</p>;
}
export function StatusSelect({ value, onChange, all = true, id = "status-filter" }) {
  return <select id={id} aria-label={all ? "Filter status laporan" : "Status"} value={value} onChange={e => onChange(e.target.value)}>
    {all && <option value="">Semua status</option>}
    {Object.entries(STATUSES).filter(([key]) => key !== "merged" && (all || !SYSTEM_STATUSES.includes(key))).map(([key,label]) => <option key={key} value={key}>{label}</option>)}
  </select>;
}
export function Pager({ page, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / 12));
  if (pages === 1) return null;
  return <nav className="lk-pager" aria-label="Halaman hasil"><button className="btn btn--ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>Sebelumnya</button><span>Halaman {page} dari {pages}</span><button className="btn btn--ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>Berikutnya</button></nav>;
}
export function Timeline({ history = [], children }) {
  return <section className="lk-section" id="riwayat-penanganan"><h2>Riwayat penanganan</h2>{history.length ? <ol className="lk-timeline">{history.map(item => <li key={item.id}><div><StatusBadge status={item.to_status} /> <time>{dateText(item.created_at)}</time></div><p>{item.note}</p><small>Progres {item.progress_percent}%</small></li>)}</ol> : <p>Belum ada pembaruan.</p>}{children}</section>;
}
export function FeedbackThread({ items = [], onPost, busy = false, placeholder = "Tulis masukan untuk penanganan..." }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const roleLabel = role => role === "user" ? "Pelapor" : role === "admin" ? "Admin" : "Instansi";
  async function submit(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || !onPost) return;
    try { await onPost(text); setMessage(""); setError(""); }
    catch (e) { setError(e.message); }
  }
  return <section className="lk-section lk-feedback" id="diskusi-penanganan">
    <h2>Diskusi Penanganan</h2>
    {items.length
      ? <ol className="lk-feedback__list">{items.map(f => <li key={f.id} className={`lk-feedback__item${f.mine ? " lk-feedback__item--mine" : ""}`}>
          <div className="lk-feedback__meta"><strong>{f.sender_name || roleLabel(f.sender_role)}</strong><span className={`lk-feedback__role lk-feedback__role--${f.sender_role}`}>{roleLabel(f.sender_role)}</span><time>{dateText(f.created_at)}</time></div>
          <p>{f.message}</p>
        </li>)}</ol>
      : <p className="lk-muted">Belum ada masukan. Sampaikan pertanyaan atau tanggapan atas penanganan laporan ini.</p>}
    {onPost && <form className="lk-feedback__form" onSubmit={submit}>
      {error && <Notice error>{error}</Notice>}
      <label className="visually-hidden" htmlFor="feedback-message">Masukan untuk penanganan</label>
      <textarea id="feedback-message" rows={3} maxLength={2000} value={message} onChange={e => setMessage(e.target.value)} placeholder={placeholder} />
      <button className="btn btn--primary" disabled={busy || !message.trim()}>{busy ? "Mengirim..." : "Kirim masukan"}</button>
    </form>}
  </section>;
}
export function PrivateReport({ report, history, followUp, feedbacks = [], onFeedback, feedbackBusy, tab = "history", onTab }) {
  const content = parseReport(report.description_raw);
  const hasCoords = Number.isFinite(Number(report?.lat)) && Number.isFinite(Number(report?.lng));
  const discuss = Boolean(onFeedback);
  const tabs = [
    { id: "history", label: "Riwayat Penanganan" },
    ...(followUp ? [{ id: "followup", label: "Tindak Lanjut Laporan" }] : []),
    { id: "discussion", label: "Diskusi Penanganan" },
  ];
  return <div className="lk-private" id="report-detail"><div className="lk-title-row"><div><p className="lk-kicker">{report.ticket_number}</p><h2>{content.title}</h2></div><StatusBadge status={report.status} /></div>
    <p className="lk-muted">{content.location || "Lokasi belum dicantumkan"} · {dateText(report.submitted_at)}</p>
    <p className="lk-muted">Penanggung jawab: {report.dinas_name || "Menunggu penetapan dinas"}</p>
    <Progress value={report.progress_percent} />
    {report.image_url && <img className="lk-photo" src={report.image_url} alt="Foto bukti laporan" />}
    {hasCoords && <div className="report-detail__map"><MapPin longitude={Number(report.lng)} latitude={Number(report.lat)} /></div>}
    <p className="lk-body-text">{content.description}</p>
    {discuss && <div className="lk-detail-tabs" role="tablist" aria-label="Bagian laporan">
      {tabs.map(t => <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`lk-detail-tabs__button${tab === t.id ? " lk-detail-tabs__button--active" : ""}`} onClick={() => onTab?.(t.id)}>{t.label}</button>)}
    </div>}
    {tab === "discussion" && discuss
      ? <FeedbackThread items={feedbacks} onPost={onFeedback} busy={feedbackBusy} />
      : tab === "followup" && followUp ? followUp
        : <Timeline history={history} />}
  </div>;
}
