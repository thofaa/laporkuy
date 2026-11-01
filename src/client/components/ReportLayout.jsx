import { useEffect, useState } from "react";
import { ClipboardList, LayoutDashboard, LogOut, Menu, PenSquare, X } from "lucide-react";
import { api, loginURL } from "../lib/api.js";
import { Notice } from "./ReportWidgets.jsx";

// Layout /lapor|/log: meniru desain dashboard /instansi (StaffLayout) —
// sidebar brand + MENU UTAMA + AKUN AKTIF, workspace konten di kanan.
export default function ReportLayout({ path, children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api("/auth/me").then(({ user }) => {
      if (!active) return;
      setUser(user);
      localStorage.setItem("laporkuy_user", JSON.stringify(user));
    }).catch(e => { if (active) setError(e); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);

  useEffect(() => {
    if (!open) return;
    const close = event => {
      if (event.key === "Escape") {
        setOpen(false);
        document.getElementById("report-menu-toggle")?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  async function logout() {
    setLeaving(true);
    try { await api("/auth/logout", { method: "POST" }); }
    catch { /* Tetap hapus sesi lokal jika server tidak dapat dihubungi. */ }
    localStorage.removeItem("laporkuy_token");
    localStorage.removeItem("laporkuy_user");
    window.location.assign("/masuk");
  }

  const create = path === "/lapor";
  const history = path === "/log" || path.startsWith("/log/");
  const links = [
    { href: "/lapor", label: "Buat laporan", icon: PenSquare, active: create },
    { href: "/log", label: "Riwayat laporan", icon: ClipboardList, active: history },
  ];
  if (["admin", "pemerintah"].includes(user?.role)) {
    links.push({ href: "/pemerintah", label: "Dashboard", icon: LayoutDashboard, active: false });
  }

  return (
    <div className="lk-staff">
      <aside className="lk-staff__sidebar">
        <div className="lk-staff__brand-row">
          <a className="brand" href="/lapor" aria-label="LaporKuy — laporan">Laporkuy<span className="brand__dot">.</span></a>
          <button id="report-menu-toggle" type="button" className="lk-staff__toggle" aria-controls="report-navigation" aria-expanded={open} aria-label={open ? "Tutup navigasi laporan" : "Buka navigasi laporan"} onClick={() => setOpen(v => !v)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
        <nav id="report-navigation" className={`lk-staff__navigation${open ? " lk-staff__navigation--open" : ""}`} aria-label="Navigasi laporan">
          <p className="lk-kicker">MENU UTAMA</p>
          {links.map(({ href, label, icon: Icon, active }) => <a key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}><Icon size={18} aria-hidden="true" /><span>{label}</span></a>)}
        </nav>
        <div className="lk-staff__account"><strong>{user?.full_name || user?.role || "Belum masuk"}</strong><span>{user?.email ?? "—"}</span>
          {user
            ? <button type="button" className="btn btn--ghost" disabled={leaving} onClick={logout}><LogOut size={16} aria-hidden="true" />{leaving ? "Keluar..." : "Keluar akun"}</button>
            : <a className="btn btn--ghost" href={loginURL()}>Masuk</a>}
        </div>
      </aside>
      <div className="lk-staff__workspace">
        <main id="main" className="lk-page container">
          {loading && <Notice>Memeriksa akun...</Notice>}
          {error && <Notice error>{error.message}
            {error.status === 401
              ? <> <a className="lk-text-link" href={loginURL()}>Masuk →</a></>
              : <button className="lk-inline-button" onClick={() => setRetry(v => v + 1)}>Coba lagi</button>}
          </Notice>}
          {!loading && !error && children(user)}
        </main>
        <footer className="lk-staff__footer">Laporkuy · Ruang kerja warga</footer>
      </div>
    </div>
  );
}
