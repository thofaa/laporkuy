import { STATUSES, parseReport } from "../../shared/reports.js";
export { STATUSES, parseReport };
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
    {Object.entries(STATUSES).filter(([key]) => key !== "merged").map(([key,label]) => <option key={key} value={key}>{label}</option>)}
  </select>;
}
export function Pager({ page, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / 12));
  if (pages === 1) return null;
  return <nav className="lk-pager" aria-label="Halaman hasil"><button className="btn btn--ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>Sebelumnya</button><span>Halaman {page} dari {pages}</span><button className="btn btn--ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>Berikutnya</button></nav>;
}
export function Timeline({ history = [] }) {
  return <section className="lk-section"><h2>Riwayat penanganan</h2>{history.length ? <ol className="lk-timeline">{history.map(item => <li key={item.id}><div><StatusBadge status={item.to_status} /> <time>{dateText(item.created_at)}</time></div><p>{item.note}</p><small>Progres {item.progress_percent}%</small></li>)}</ol> : <p>Belum ada pembaruan.</p>}</section>;
}
export function PrivateReport({ report, history }) {
  const content = parseReport(report.description_raw);
  return <><div className="lk-title-row"><div><p className="lk-kicker">{report.ticket_number}</p><h2>{content.title}</h2></div><StatusBadge status={report.status} /></div>
    <p className="lk-muted">{content.location || "Lokasi belum dicantumkan"} · {dateText(report.submitted_at)}</p>
    <p className="lk-muted">Penanggung jawab: {report.dinas_name || "Menunggu penetapan dinas"}</p>
    <Progress value={report.progress_percent} />
    {report.image_url && <img className="lk-photo" src={report.image_url} alt="Foto bukti laporan" />}
    <p className="lk-body-text">{content.description}</p><Timeline history={history} /></>;
}
