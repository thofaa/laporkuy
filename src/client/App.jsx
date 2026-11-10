import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import DemoBanner from "./components/DemoBanner.jsx";
import Landing from "./pages/Landing.jsx";
import Auth from "./pages/Auth.jsx";
import Report, { PersonalReport } from "./pages/Report.jsx";
import Government from "./pages/Government.jsx";
import PublicReports from "./pages/PublicReports.jsx";
import Info from "./pages/Info.jsx";
import Faq from "./pages/Faq.jsx";
import StaffLayout from "./components/StaffLayout.jsx";
import ReportLayout from "./components/ReportLayout.jsx";

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const oauthToken = params.get("oauth_token");
  const oauthUser = params.get("oauth_user");
  if (oauthToken && oauthUser) {
    try {
      const decoded = atob(oauthUser.replace(/-/g, "+").replace(/_/g, "/").padEnd(oauthUser.length + ((4 - (oauthUser.length % 4)) % 4), "="));
      const user = JSON.parse(decoded);
      localStorage.setItem("laporkuy_token", oauthToken);
      localStorage.setItem("laporkuy_user", JSON.stringify(user));
      window.location.replace(["admin", "pemerintah"].includes(user.role) ? "/pemerintah" : "/");
    } catch { /* token rusak; biarkan halaman berjalan normal */ }
  }
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const isAuth = path === "/masuk" || path === "/daftar";
  const publicTicket = path.match(/^\/laporan\/([^/]+)$/)?.[1];
  const governmentId = path.match(/^\/pemerintah\/laporan\/([^/]+)$/)?.[1];
  const staffTicket = path.match(/^\/pemerintah\/katalog\/([^/]+)$/)?.[1];
  const staffCatalog = path === "/pemerintah/katalog" || Boolean(staffTicket);
  const staffArea = ["/pemerintah", "/pemerintah/daftar", "/pemerintah/tinjau"].includes(path) || Boolean(governmentId) || staffCatalog;
  if (staffArea) return <><DemoBanner /><a className="skip-link" href="#main">Lewati ke konten</a><StaffLayout path={path}>{user => staffCatalog
    ? <PublicReports ticket={staffTicket} staff />
    : <Government id={governmentId} user={user} view={path === "/pemerintah/daftar" ? "reports" : path === "/pemerintah/tinjau" ? "review" : "dashboard"} />}</StaffLayout></>;
  const logReportId = path.match(/^\/log\/laporan\/([^/]+)$/)?.[1];
  if (["/lapor", "/log"].includes(path) || Boolean(logReportId)) {
    return <><DemoBanner /><a className="skip-link" href="#main">Lewati ke konten</a><ReportLayout path={path}>{() => logReportId ? <PersonalReport id={logReportId} /> : <Report />}</ReportLayout></>;
  }
  let page;
  if (isAuth) page = <Auth mode={path === "/masuk" ? "login" : "register"} />;
  else if (path === "/faq") page = <Faq />;
  else if (path === "/laporan" || publicTicket) page = <PublicReports ticket={publicTicket} />;
  else if (path === "/") page = <Landing />;
  else page = <Info path={path} />;
  return <><DemoBanner />{!isAuth && <><a className="skip-link" href="#main">Lewati ke konten</a><Header /></>}<main id="main">{page}</main>{!isAuth && <Footer />}</>;
}
