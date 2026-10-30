import { useState } from "react";

const NAV = [
  { href: "/lacak", label: "Lacak Laporan" },
  { href: "/tentang", label: "Tentang Kami" },
  { href: "/faq", label: "FAQ" },
  { href: "/kontak", label: "Hubungi Kami" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
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
              <a className="header__link" href="/masuk" onClick={() => setOpen(false)}>
                Masuk
              </a>
              <a className="btn btn--ghost" href="/daftar" onClick={() => setOpen(false)}>
                Daftar
              </a>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
