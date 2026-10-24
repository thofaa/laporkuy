import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Landing from "./pages/Landing.jsx";

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Lewati ke konten
      </a>
      <Header />
      <main id="main">
        <Landing />
      </main>
      <Footer />
    </>
  );
}
