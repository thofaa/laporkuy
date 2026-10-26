import { useEffect, useState } from "react";
import {
  Menu,
  MessageCircleWarning,
  ClipboardList,
} from "lucide-react";

const STATUS_LABEL = {
  submitted: "Diproses",
  needs_review: "Diproses",
  routed: "Diproses",
  accepted: "Diproses",
  in_progress: "Diproses",
  resolved: "Success",
  rejected: "Ditolak",
  merged: "Digabung",
};

function LogView({ userId }) {
  const [logs, setLogs] = useState(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/log?user_id=${encodeURIComponent(userId)}`)
      .then((res) => res.json())
      .then((json) => setLogs(json.data ?? []))
      .catch(() => setLogs([]));
  }, [userId]);

  if (!userId) {
    return <p className="log-empty">Masuk untuk melihat log laporan Anda.</p>;
  }
  if (logs === null) {
    return <p className="log-empty">Memuat log laporan...</p>;
  }
  return (
    <ul className="log-list">
      {logs.map((item) => (
        <li key={item.id} className="log-item">
          <span className="log-item__ticket">{item.ticket_number}</span>
          <span className="log-item__status">
            {STATUS_LABEL[item.status] ?? item.status}
          </span>
          <time>{new Date(item.submitted_at).toLocaleDateString("id-ID")}</time>
        </li>
      ))}
    </ul>
  );
}

export default function Report() {
  const path = window.location.pathname;
  const user = JSON.parse(localStorage.getItem("laporkuy_user") ?? "null");
  // ponytail: sessionStorage biar collapse kebetan saat pindah /lapor <-> /log
  const [sidebarState, setSidebarState] = useState(
    () =>
      sessionStorage.getItem("laporkuy_sidebar") ??
      (window.innerWidth <= 900 ? "collapse" : "expand"),
  );
  const [activeMenu, setActiveMenu] = useState(path === "/log" ? "log" : "buat");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  function selectMenu(menu) {
    setActiveMenu(menu);
    const target = menu === "log" ? "/log" : "/lapor";
    if (window.location.pathname !== target) window.location.href = target;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError(false);
    const res = await fetch("/api/submit-laporan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user?.id,
        description_raw: `${title}\nLokasi: ${location}\n\n${description}`,
        image_url: imageUrl || null,
      }),
    });
    if (!res.ok) {
      setSubmitError(true);
      return;
    }
    setSubmitted(true);
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload-image", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "upload_failed");
      setImageUrl(json.image_url);
    } catch {
      setImageUrl("");
      setPhotoError("Gagal mengunggah foto. Coba lagi.");
    } finally {
      setUploading(false);
    }
  }

  function handleToggleSidebar() {
    const next = sidebarState === "collapse" ? "expand" : "collapse";
    setSidebarState(next);
    sessionStorage.setItem("laporkuy_sidebar", next);
  }

  return (
    <div
      className={`report-layout${sidebarState === "collapse" ? " report-layout--collapsed" : ""}`}
    >
      <aside className="report-sidebar">
        <div className="report-side__head">
          <button
            type="button"
            className="report-side__icon-btn"
            onClick={handleToggleSidebar}
          >
            <Menu size={18} />
          </button>
          {sidebarState === "expand" && (
            <span className="report-side__title">Menu</span>
          )}
        </div>
        <ul className="report-side__list">
          <li className={activeMenu === "buat" ? "report-side__item--active" : ""}>
            <button
              type="button"
              className="report-side__icon-btn"
              onClick={() => selectMenu("buat")}
            >
              <MessageCircleWarning size={18} />
            </button>
            {sidebarState === "expand" && (
              <span className="report-side__title">Buat Laporan</span>
            )}
          </li>
          <li className={activeMenu === "log" ? "report-side__item--active" : ""}>
            <button
              type="button"
              className="report-side__icon-btn"
              onClick={() => selectMenu("log")}
            >
              <ClipboardList size={18} />
            </button>
            {sidebarState === "expand" && (
              <span className="report-side__title">Log Laporan</span>
            )}
          </li>
        </ul>
      </aside>

      <section className="report-canvas" aria-labelledby="report-canvas-title">
        <header className="report-canvas__head">
          <h1 className="report-canvas__title" id="report-canvas-title">
            {activeMenu === "log" ? "Log Laporan" : "Buat Laporan"}
          </h1>
          <p className="report-canvas__sub">
            {activeMenu === "log"
              ? "Belum ada laporan yang tercatat. Seluruh laporan yang Anda buat akan muncul di sini!"
              : "Satu form, tanpa memilih dinas, status jelas. Laporkan masalah layanan publik dan pantau penanganannya secara transparan."}
          </p>
        </header>

        {submitted ? (
          <div className="report-success">
            <h2 className="report-success__title">Laporan masuk</h2>
            <p className="report-success__text">
              Terima kasih. Laporan Anda sudah masuk dan akan diberi ticket setelah
              proses verifikasi.
            </p>
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => setSubmitted(false)}
            >
              Buat laporan lain
            </button>
          </div>
        ) : activeMenu === "log" ? (
          <LogView userId={user?.id} />
        ) : (
          <form className="report-form" onSubmit={handleSubmit}>
            <div className="report-field">
              <label className="report-label" htmlFor="report-title">
                Judul
              </label>
              <input
                id="report-title"
                className="report-input"
                type="text"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Singkat dan padat, mis. Jalan berlubang di Jl. Soekarno Hatta"
              />
            </div>

            <div className="report-field">
              <label className="report-label" htmlFor="report-location">
                Lokasi
              </label>
              <textarea
                id="report-location"
                className="report-input"
                rows={2}
                required
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Alamat atau titik lokasi kejadian"
              />
            </div>

            <div className="report-field">
              <label className="report-label" htmlFor="report-description">
                Deskripsi
              </label>
              <textarea
                id="report-description"
                className="report-input"
                rows={5}
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Detail kejadian, konteks, dan dampaknya"
              />
            </div>

            <div className="report-field">
              <label className="report-label" htmlFor="report-photo">
                Foto (opsional)
              </label>
              <input
                id="report-photo"
                className="report-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoChange}
              />
              {uploading && <p className="report-label">Mengunggah foto...</p>}
              {photoError && <p className="report-error">{photoError}</p>}
              {imageUrl && (
                <img
                  className="report-photo__preview"
                  src={imageUrl}
                  alt="Pratinjau foto laporan"
                />
              )}
            </div>

            {submitError && (
              <p className="report-error">Gagal mengirim laporan. Coba lagi.</p>
            )}

            <button
              className="btn btn--primary report-submit"
              type="submit"
              disabled={uploading}
            >
              Kirim Laporan
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
