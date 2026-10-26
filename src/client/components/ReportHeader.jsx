import { CircleUserRound } from "lucide-react";

export default function ReportHeader() {
  const user = JSON.parse(localStorage.getItem("laporkuy_user") ?? "null");

  return (
    <header className="header">
      <div className="header__inner header-lapor">
        <a className="brand" href="/" aria-label="Laporkuy — beranda">
          Laporkuy<span className="brand__dot">.</span>
        </a>
        <button
          type="button"
          className="header__account"
          aria-label={user?.email ? `Akun ${user.email}` : "Akun"}
        >
          <CircleUserRound size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
