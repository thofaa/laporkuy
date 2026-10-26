import Header from "./components/Header.jsx";
import ReportHeader from "./components/ReportHeader.jsx";
import Footer from "./components/Footer.jsx";
import Landing from "./pages/Landing.jsx";
import Auth from "./pages/Auth.jsx";
import Report from "./pages/Report.jsx";

export default function App() {
  const path = window.location.pathname;
  const isAuth = path === "/masuk" || path === "/daftar";
  const isReport = path === "/lapor" || path === "/log";

  return (
    <>
      {!isAuth && (
        <a className="skip-link" href="#main">
          Lewati ke konten
        </a>
      )}
      {!isAuth && (isReport ? <ReportHeader /> : <Header />)}
      <main id="main">
        {isAuth ? (
          <Auth mode={path === "/masuk" ? "login" : "register"} />
        ) : isReport ? (
          <Report />
        ) : (
          <Landing />
        )}
      </main>
      {!isAuth && <Footer />}
    </>
  );
}
