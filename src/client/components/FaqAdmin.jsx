import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Notice, dateText } from "./ReportWidgets.jsx";

export default function FaqAdmin() {
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setError("");
    api("/faq/questions").then(r => { if (active) setData(r.data); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [retry]);

  async function answer(id) {
    setBusy(id); setError("");
    try {
      await api(`/faq/questions/${id}/answer`, { method: "POST", body: JSON.stringify({ answer: answers[id] }) });
      setAnswers(a => ({ ...a, [id]: "" }));
      setData(await api("/faq/questions").then(r => r.data));
    } catch (e) { setError(e.message); }
    finally { setBusy(""); }
  }

  const open = data?.filter(q => q.status === "open") ?? [];
  const answered = data?.filter(q => q.status === "answered") ?? [];

  return <section className="lk-panel lk-faq-admin" aria-labelledby="faq-admin-title">
    <div className="lk-title-row"><h2 id="faq-admin-title">Pertanyaan Pengguna</h2><span className="lk-muted">{open.length} menunggu jawaban</span></div>
    {error && <Notice error>{error} <button className="lk-inline-button" onClick={() => setRetry(retry + 1)}>Coba lagi</button></Notice>}
    {!data && !error && <Notice>Memuat pertanyaan...</Notice>}
    {data && open.length === 0 && <p className="lk-muted">Tidak ada pertanyaan yang menunggu jawaban.</p>}
    {open.map(q => <article className="lk-faq-q lk-faq-q--open" key={q.id}>
      <div className="lk-faq-q__meta"><strong>{q.question}</strong><time>{dateText(q.created_at)}</time></div>
      <p className="lk-muted">Dari: {q.user_name || "Pengguna"}</p>
      <form className="lk-edit-form" onSubmit={e => { e.preventDefault(); answer(q.id); }}>
        <label className="visually-hidden" htmlFor={`faq-answer-${q.id}`}>Jawaban</label>
        <textarea id={`faq-answer-${q.id}`} rows={3} maxLength={3000} required value={answers[q.id] ?? ""} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} placeholder="Tulis jawaban untuk pengguna..." />
        <button className="btn btn--primary" disabled={Boolean(busy) || !(answers[q.id] ?? "").trim()}>{busy === q.id ? "Menyimpan..." : "Jawab"}</button>
      </form>
    </article>)}
    {answered.length > 0 && <details className="lk-faq-answered">
      <summary>Pertanyaan terjawab ({answered.length})</summary>
      {answered.map(q => <article className="lk-faq-q" key={q.id}>
        <div className="lk-faq-q__meta"><strong>{q.question}</strong><time>{dateText(q.created_at)}</time></div>
        <p className="lk-faq-q__answer">{q.answer}</p>
      </article>)}
    </details>}
  </section>;
}