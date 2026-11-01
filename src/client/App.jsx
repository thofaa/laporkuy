import Header from "./components/Header.jsx";
import ReportHeader from "./components/ReportHeader.jsx";
import Footer from "./components/Footer.jsx";
import DemoBanner from "./components/DemoBanner.jsx";
import Landing from "./pages/Landing.jsx";
import Auth from "./pages/Auth.jsx";
import Report from "./pages/Report.jsx";
import Government from "./pages/Government.jsx";
import PublicReports from "./pages/PublicReports.jsx";
import TrackReport from "./pages/TrackReport.jsx";
import Info from "./pages/Info.jsx";
import StaffLayout from "./components/StaffLayout.jsx";

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const isAuth = path === "/masuk" || path === "/daftar";
  const privateArea = ["/lapor","/log"].includes(path) || path.startsWith("/pemerintah");
  const publicTicket = path.match(/^\/laporan\/([^/]+)$/)?.[1];
  const governmentId = path.match(/^\/pemerintah\/laporan\/([^/]+)$/)?.[1];
  const staffTicket = path.match(/^\/pemerintah\/katalog\/([^/]+)$/)?.[1];
  const staffCatalog = path === "/pemerintah/katalog" || Boolean(staffTicket);
  const staffArea = ["/pemerintah", "/pemerintah/daftar"].includes(path) || Boolean(governmentId) || staffCatalog;
  if (staffArea) return <><DemoBanner /><a className="skip-link" href="#main">Lewati ke konten</a><StaffLayout path={path}>{user => staffCatalog
    ? <PublicReports ticket={staffTicket} staff />
    : <Government id={governmentId} user={user} view={path === "/pemerintah/daftar" ? "reports" : "dashboard"} />}</StaffLayout></>;
  let page;
  if (isAuth) page = <Auth mode={path === "/masuk" ? "login" : "register"} />;
  else if (["/lapor","/log"].includes(path)) page = <Report />;
  else if (path === "/laporan" || publicTicket) page = <PublicReports ticket={publicTicket} />;
  else if (path === "/lacak") page = <TrackReport />;
  else if (path === "/") page = <Landing />;
  else page = <Info path={path} />;
  return <><DemoBanner />{!isAuth && <><a className="skip-link" href="#main">Lewati ke konten</a>{privateArea ? <ReportHeader /> : <Header />}</>}<main id="main">{page}</main>{!isAuth && <Footer />}</>;
}
