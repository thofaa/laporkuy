import { useEffect, useState } from "react";
import Header from "./Header.jsx";
import { api } from "../lib/api.js";

export default function CatalogHeader() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");

    api("/auth/me")
      .then((result) => {
        if (active) setUser(result.user);
      })
      .catch((err) => {
        if (!active) return;

        setUser(null);

        // Pengunjung yang belum login memakai navigasi umum.
        if (err.status !== 401) {
          setError("Informasi akun belum dapat dimuat.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retry]);

  if (loading) {
    return (
      <header className="catalog-header">
        <div className="catalog-header__inner">
          <a className="catalog-header__brand" href="/">
            LaporKuy.
          </a>
          <p role="status">Memuat navigasi akun...</p>
        </div>
      </header>
    );
  }

  if (error) {
    return (
      <header className="catalog-header">
        <div className="catalog-header__inner">
          <p role="alert">{error}</p>

          <button
            className="btn btn--ghost"
            onClick={() => setRetry((value) => value + 1)}
          >
            Coba lagi
          </button>
        </div>
      </header>
    );
  }

  const isAdmin = user?.role === "admin";
  const isPetugas = user?.role === "pemerintah";

  // Akun masyarakat dan pengunjung memakai header yang sudah ada.
  if (!isAdmin && !isPetugas) {
    return <Header />;
  }

  const roleLabel = isAdmin
    ? "Admin pemerintah"
    : "Petugas dinas";

  return (
    <header className="catalog-header">
      <div className="catalog-header__inner">
        <a
          className="catalog-header__brand"
          href="/pemerintah"
          aria-label="LaporKuy — dashboard pemerintah"
        >
          LaporKuy.
        </a>

        <nav
          className="catalog-header__nav"
          aria-label="Navigasi katalog untuk pemerintah"
        >
          <a
            className="catalog-header__link"
            href="/pemerintah"
          >
            ← Kembali ke dashboard
          </a>

          <a
            className="catalog-header__link"
            href="/laporan"
            aria-current="page"
          >
            Katalog publik
          </a>
        </nav>

        <div className="catalog-header__account">
          <span className="catalog-header__role">
            {roleLabel}
          </span>

          <span className="catalog-header__name">
            {user.full_name || user.email}
          </span>
        </div>
      </div>

      <div className="catalog-header__notice">
        Kamu sedang melihat laporan yang dipublikasikan.
        Untuk memberikan tanggapan atau mengubah status,
        kembali ke dashboard.
      </div>
    </header>
  );
}