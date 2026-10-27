import { useEffect, useRef, useState } from "react";
import { CircleUserRound } from "lucide-react";

function authHeaders() {
  const token = localStorage.getItem("laporkuy_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ReportHeader() {
  const user = JSON.parse(localStorage.getItem("laporkuy_user") ?? "null");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", headers: authHeaders() });
    } catch {
      // ponytail: logout tetap lanjut hapus lokal walau server gagal
    }
    localStorage.removeItem("laporkuy_token");
    localStorage.removeItem("laporkuy_user");
    window.location.href = "/masuk";
  }

  return (
    <header className="header">
      <div className="header__inner header-lapor">
        <a className="brand" href="/" aria-label="Laporkuy — beranda">
          Laporkuy<span className="brand__dot">.</span>
        </a>
        <div className="header__account-wrap" ref={wrapRef}>
          <button
            type="button"
            className="header__account"
            aria-label={user?.email ? `Akun ${user.email}` : "Akun"}
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={() => setOpen((v) => !v)}
          >
            <CircleUserRound size={18} aria-hidden="true" />
          </button>
          {open && (
            <div className="account-menu" role="menu">
              <span className="account-menu__email">{user?.email ?? "Pengguna"}</span>
              <button
                type="button"
                className="account-menu__logout"
                role="menuitem"
                onClick={handleLogout}
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
