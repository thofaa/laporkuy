import { useState } from "react";
import { api, currentAccount } from "../lib/api.js";

const NAV = [
  { href: "/laporan", label: "Katalog" },
  { href: "/tentang", label: "Tentang Kami" },
  { href: "/faq", label: "FAQ" },
  { href: "/kontak", label: "Hubungi Kami" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  const user = currentAccount();
  const [loggingOut, setLoggingOut] = useState(false);

  const isStaff = ["admin", "pemerintah"].includes(user?.role);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // Tetap keluar dari perangkat ini jika server tidak dapat dihubungi.
    } finally {
      localStorage.removeItem("laporkuy_token");
      localStorage.removeItem("laporkuy_user");
      window.location.href = "/";
    }
  }

  const accountLabel =
    user?.role === "admin"
      ? "Admin pemerintah"
      : user?.role === "pemerintah"
        ? "Petugas dinas"
        : "Masyarakat";

  const dashboardLabel =
    user?.role === "admin"
      ? "Dashboard pemerintah"
      : "Dashboard dinas";

  return (
    <>
      <div className="topbar">
        <div className="container topbar__inner">
          <span className="topbar__dot" aria-hidden="true" />
          {user ? `LaporKuy · ${accountLabel} · Layanan publik` : "Prototipe LaporKuy · Pelaporan layanan publik"}
        </div>
      </div>

      <header className="header">
        <div className="container header__inner">
          <a className="brand" href="/" aria-label="Laporkuy — beranda">
            Laporkuy<span className="brand__dot">.</span>
          </a>

          <button
            type="button"
            className="header__toggle"
            aria-expanded={open}
            aria-controls="primary-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="header__toggle-lines" aria-hidden="true" />
            <span className="visually-hidden">
              {open ? "Tutup menu" : "Buka menu"}
            </span>
          </button>

          <nav
            id="primary-nav"
            className={`header__nav${open ? " header__nav--open" : ""}`}
            aria-label="Navigasi utama"
          >
            <ul className="header__links">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a className="header__link" href={item.href} onClick={() => setOpen(false)}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="header__actions">
              {user ? (
                <>
                  <a
                    className="header__link"
                    href={isStaff ? "/pemerintah" : "/lapor"}
                    onClick={() => setOpen(false)}
                  >
                    {isStaff
                      ? user.role === "admin"
                        ? "Dashboard"
                        : "Dashboard dinas"
                      : "Dashboard"}
                  </a>
                    
                  <button
                    className="btn btn--ghost"
                    type="button"
                    disabled={loggingOut}
                    onClick={handleLogout}
                  >
                    {loggingOut ? "Keluar..." : "Keluar"}
                  </button>
                </>
              ) : (
                <>
                  <a
                    className="header__link"
                    href="/masuk"
                    onClick={() => setOpen(false)}
                  >
                    Masuk
                  </a>
              
                  <a
                    className="btn btn--ghost"
                    href="/daftar"
                    onClick={() => setOpen(false)}
                  >
                    Daftar
                  </a>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
