import { useEffect, useState } from "react";
import { LayoutDashboard, ClipboardList, Globe2, LogOut, Menu, X } from "lucide-react";
import { api, loginURL } from "../lib/api.js";
import { Notice } from "./ReportWidgets.jsx";

export default function StaffLayout({ path, children }) {
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
        document.getElementById("staff-menu-toggle")?.focus();
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

  if (loading || error || !["admin", "pemerintah"].includes(user?.role)) {
    return <main id="main" className="lk-page container">
      <a className="brand" href="/">Laporkuy<span className="brand__dot">.</span></a>
      <h1>Ruang kerja petugas</h1>
      {loading ? <Notice>Memeriksa akses akun...</Notice> : error ? <Notice error>
        {error.message}{" "}
        {error.status === 401 ? <a className="lk-text-link" href={loginURL()}>Masuk sebagai petugas</a>
          : <button className="lk-inline-button" onClick={() => setRetry(v => v + 1)}>Coba lagi</button>}
      </Notice> : <Notice error>Halaman ini tersedia untuk admin pemerintah dan petugas dinas. <a className="lk-text-link" href="/laporan">Kembali ke katalog masyarakat</a></Notice>}
    </main>;
  }

  const admin = user.role === "admin";
  const role = admin ? "Admin pemerintah" : "Petugas dinas";
  const catalogue = path === "/pemerintah/katalog" || path.startsWith("/pemerintah/katalog/");
  const managing = path === "/pemerintah/daftar" || path.startsWith("/pemerintah/laporan/");
  const title = catalogue ? "Katalog publik" : managing ? (admin ? "Kelola laporan" : "Laporan dinas") : "Dashboard";
  const links = [
    { href: "/pemerintah", label: admin ? "Dashboard" : "Dashboard dinas", icon: LayoutDashboard, active: !catalogue && !managing },
    { href: "/pemerintah/daftar", label: admin ? "Kelola laporan" : "Laporan dinas", icon: ClipboardList, active: managing },
    { href: "/pemerintah/katalog", label: "Katalog publik", icon: Globe2, active: catalogue },
  ];

  return <div className="lk-staff">
    <aside className="lk-staff__sidebar">
      <div className="lk-staff__brand-row">
        <a className="brand" href="/pemerintah" aria-label="LaporKuy — dashboard petugas">Laporkuy<span className="brand__dot">.</span></a>
        <button id="staff-menu-toggle" type="button" className="lk-staff__toggle" aria-controls="staff-navigation" aria-expanded={open} aria-label={open ? "Tutup navigasi petugas" : "Buka navigasi petugas"} onClick={() => setOpen(v => !v)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      <div className="lk-staff__identity"><p className="lk-kicker">RUANG KERJA</p><strong>{role}</strong><span>{admin ? "Pengelolaan lintas dinas" : "Penanganan laporan dinas"}</span></div>
      <nav id="staff-navigation" className={`lk-staff__navigation${open ? " lk-staff__navigation--open" : ""}`} aria-label={`Navigasi ${role.toLowerCase()}`}>
        <p className="lk-kicker">MENU UTAMA</p>
        {links.map(({ href, label, icon: Icon, active }) => <a key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}><Icon size={18} aria-hidden="true" /><span>{label}</span></a>)}
      </nav>
      <div className="lk-staff__account"><p className="lk-kicker">AKUN AKTIF</p><strong>{user.full_name || role}</strong><span>{user.email}</span><button type="button" className="btn btn--ghost" disabled={leaving} onClick={logout}><LogOut size={16} aria-hidden="true" />{leaving ? "Keluar..." : "Keluar akun"}</button></div>
    </aside>
    <div className="lk-staff__workspace">
      <header className="lk-staff__topbar"><p>{role}<span aria-hidden="true"> / </span><strong>{title}</strong></p><span className="lk-badge">{catalogue ? "Tampilan publik · Baca saja" : "Area kerja petugas"}</span></header>
      <main id="main">{children(user)}</main>
      <footer className="lk-staff__footer">LaporKuy · Ruang kerja {admin ? "pemerintah" : "dinas"}</footer>
    </div>
  </div>;
}
