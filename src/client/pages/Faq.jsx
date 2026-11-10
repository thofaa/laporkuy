import { useEffect, useState } from "react";
import { api, currentAccount, loginURL } from "../lib/api.js";
import { Notice, dateText } from "../components/ReportWidgets.jsx";

const FAQS = [
  {
    q: "Bagaimana cara melapor?",
    a: "Masuk atau daftar, lalu buka menu Buat Laporan. Isi judul, lokasi, deskripsi, dan foto bila diperlukan. Kamu juga bisa memilih dinas tujuan secara opsional; jika dikosongkan, sistem akan meneruskan laporan ke dinas terkait secara otomatis.",
  },
  {
    q: "Bagaimana memantau laporan saya?",
    a: "Buka menu Riwayat laporan (Laporan Saya). Setiap laporan punya nomor tiket; di halaman detail kamu bisa melihat progres penanganan, riwayat, diskusi dengan petugas, dan meminta perutean ulang (Rutekan Balik) bila dinas tujuan dirasa kurang tepat.",
  },
  {
    q: "Ke dinas mana laporan saya akan diteruskan?",
    a: "Laporan dirutekan ke dinas yang berwenang menangani kategori masalahnya (mis. jalan berlubang ke Dinas PUPR, sampah ke Dinas Lingkungan Hidup). Jika sistem ragu, laporan masuk antrean admin untuk ditetapkan dinasnya.",
  },
];

export default function Faq() {
  const account = currentAccount();
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mine, setMine] = useState(null);
  const [open, setOpen] = useState(0);

  useEffect(() => {
    if (!account) return;
    let active = true;
    api("/faq/questions/mine").then(r => { if (active) setMine(r.data); }).catch(() => {});
    return () => { active = false; };
  }, [account]);

  async function ask(event) {
    event.preventDefault();
    setBusy(true); setError(""); setSuccess("");
    try {
      await api("/faq/questions", { method: "POST", body: JSON.stringify({ question }) });
      setQuestion(""); setSuccess("Pertanyaan terkirim ke admin. Jawaban akan muncul di sini.");
      setMine(await api("/faq/questions/mine").then(r => r.data));
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return <section className="lk-page container">
    <p className="lk-kicker">LAPORKUY</p>
    <h1>Pertanyaan umum</h1>
    <div className="lk-faq-list">
      {FAQS.map((f, i) => (
        <details key={f.q} className="lk-faq-item" open={open === i} onToggle={e => e.currentTarget.open && setOpen(i)}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>

    <section className="lk-faq-ask" aria-labelledby="faq-ask-title">
      <h2 id="faq-ask-title">Belum menemukan jawaban? Tanyakan langsung</h2>
      <p className="lk-muted">Pertanyaanmu akan diteruskan ke admin dan dijawab di dashboard.</p>
      {!account
        ? <p className="lk-muted">Masuk terlebih dahulu untuk bertanya. <a className="lk-text-link" href={loginURL()}>Masuk →</a></p>
        : <form className="lk-edit-form" onSubmit={ask}>
            {error && <Notice error>{error}</Notice>}
            {success && <Notice>{success}</Notice>}
            <label htmlFor="faq-question">Pertanyaan<textarea id="faq-question" rows={4} maxLength={2000} minLength={10} required value={question} onChange={e => setQuestion(e.target.value)} placeholder="Tulis pertanyaanmu tentang layanan LaporKuy..." /></label>
            <button className="btn btn--primary" disabled={busy}>{busy ? "Mengirim..." : "Kirim pertanyaan"}</button>
          </form>}
      {mine && <div className="lk-faq-mine">
        <h3>Pertanyaanku</h3>
        {mine.length === 0 && <p className="lk-muted">Belum ada pertanyaan.</p>}
        {mine.map(q => (
          <article className="lk-faq-q" key={q.id}>
            <div className="lk-faq-q__meta"><strong>{q.question}</strong><time>{dateText(q.created_at)}</time>{q.status === "answered" ? <span className="lk-badge lk-badge--resolved">Terjawab</span> : <span className="lk-badge lk-badge--needs_review">Menunggu</span>}</div>
            {q.answer ? <p className="lk-faq-q__answer">{q.answer}</p> : <p className="lk-muted">Belum dijawab admin.</p>}
          </article>
        ))}
      </div>}
    </section>
  </section>;
}