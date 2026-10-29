import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Menu,
  MessageCircleWarning,
  ClipboardList,
} from "lucide-react";
import placeholderUrl from "../assets/report-placeholder.svg";
import MapView from "../components/MapView.jsx";

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

function authHeaders() {
  const token = localStorage.getItem("laporkuy_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handle401(res) {
  if (res.status === 401) {
    localStorage.removeItem("laporkuy_token");
    localStorage.removeItem("laporkuy_user");
    window.location.href = "/masuk";
    return true;
  }
  return false;
}

// ponytail: description_raw = "judul\nLokasi: lokasi\n\ndeskripsi" (format client), parse di sini
function parseReport(raw = "") {
  const [title, ...rest] = String(raw).split("\n");
  const lokIdx = rest.findIndex((line) => line.startsWith("Lokasi: "));
  const location = lokIdx === -1 ? "" : rest[lokIdx].slice("Lokasi: ".length).trim();
  const description = (
    lokIdx === -1 ? rest : rest.slice(lokIdx + 1)
  ).join("\n").replace(/^\s+/, "");
  return { title, location, description };
}

function LogItem({ item, expanded, onToggle, onOpen }) {
  const { title, location } = parseReport(item.description_raw);
  return (
    <li className="log-item">
      <div
        className="log-item__row"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={() => onToggle(item.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle(item.id);
          }
        }}
      >
        <span className="log-item__ticket">{item.ticket_number}</span>
        <span className="log-item__status">
          {STATUS_LABEL[item.status] ?? item.status}
        </span>
        <time>{new Date(item.submitted_at).toLocaleDateString("id-ID")}</time>
        <button
          type="button"
          className="log-item__open"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(item.id);
          }}
        >
          Buka
        </button>
      </div>
      {expanded && (
        <div className="log-item__preview">
          <div className="log-preview__photo">
            <img
              src={item.image_url || placeholderUrl}
              alt={item.image_url ? `Foto laporan ${item.ticket_number}` : "Laporan tanpa foto"}
            />
          </div>
          <div className="log-preview__meta">
            <h4 className="log-preview__title">{title}</h4>
            <p className="log-preview__location">{location || "Lokasi tidak tercantum"}</p>
          </div>
        </div>
      )}
    </li>
  );
}

function ReportDetail({ item }) {
  const { location, description } = parseReport(item.description_raw);
  return (
    <article className="report-detail">
      <img
        className="report-detail__photo"
        src={item.image_url || placeholderUrl}
        alt={item.image_url ? `Foto laporan ${item.ticket_number}` : "Laporan tanpa foto"}
      />
      <p className="report-detail__location">{location || "Lokasi tidak tercantum"}</p>
      <p className="report-detail__desc">{description || "—"}</p>
    </article>
  );
}

function LogView({ logs, detailId, setDetailId }) {
  const [expandedId, setExpandedId] = useState(null);

  if (logs === null) {
    return <p className="log-empty">Memuat log laporan...</p>;
  }

  if (detailId) {
    const item = logs.find((l) => l.id === detailId);
    if (item) {
      return <ReportDetail item={item} />;
    }
  }

  return (
    <ul className="log-list">
      {logs.map((item) => (
        <LogItem
          key={item.id}
          item={item}
          expanded={expandedId === item.id}
          onToggle={(id) => setExpandedId((cur) => (cur === id ? null : id))}
          onOpen={setDetailId}
        />
      ))}
    </ul>
  );
}

export default function Report() {
  const path = window.location.pathname;
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
  const [submitError, setSubmitError] = useState("");
  const [point, setPoint] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [logs, setLogs] = useState(null);
  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    if (activeMenu !== "log") return;
    fetch("/api/log", { headers: authHeaders() })
      .then((res) => (handle401(res) ? [] : res.json()))
      .then((json) => setLogs(json?.data ?? []))
      .catch(() => setLogs([]));
  }, [activeMenu]);

  function selectMenu(menu) {
    setActiveMenu(menu);
    const target = menu === "log" ? "/log" : "/lapor";
    if (window.location.pathname !== target) window.location.href = target;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    if (!point) {
      setSubmitError("Pilih titik lokasi di peta terlebih dahulu.");
      return;
    }
    const res = await fetch("/api/submit-laporan", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        description_raw: `${title}\nLokasi: ${location}\n\n${description}`,
        image_url: imageUrl || null,
        lat: point.lat,
        lng: point.lng,
        address: point.label || null,
      }),
    });
    if (handle401(res) || !res.ok) {
      setSubmitError("Gagal mengirim laporan. Coba lagi.");
      return;
    }
    setSubmitted(true);
    setPoint(null);
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
          {(activeMenu === "log" && detailId) && (
            <button
              type="button"
              className="btn btn--outline report-detail__back"
              onClick={() => setDetailId(null)}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Kembali
            </button>
          )}
          <h1 className="report-canvas__title" id="report-canvas-title">
            {activeMenu === "log"
              ? detailId
                ? parseReport(
                    (logs ?? []).find((l) => l.id === detailId)?.description_raw ?? "",
                  ).title
                : "Log Laporan"
              : "Buat Laporan"}
          </h1>
          {activeMenu === "log" && logs !== null && logs.length === 0 && (
            <p className="report-canvas__sub">
              Belum ada laporan yang tercatat. Seluruh laporan yang Anda buat akan
              muncul di sini!
            </p>
          )}
          {activeMenu === "buat" && (
            <p className="report-canvas__sub">
              Satu form, tanpa memilih dinas, status jelas. Laporkan masalah
              layanan publik dan pantau penanganannya secara transparan.
            </p>
          )}
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
          <LogView logs={logs} detailId={detailId} setDetailId={setDetailId} />
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

            <div className="report-field">
              <span className="report-label">Titik lokasi</span>
              <MapView value={point} onChange={setPoint} />
              {point?.label && (
                <p className="report-map__address">{point.label}</p>
              )}
            </div>

            {submitError && <p className="report-error">{submitError}</p>}

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
