import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import OrbitCard from "../components/OrbitCard.jsx";
import shadeUrl from "../assets/shade.png";

const SLOGANS = ["satu form", "status jelas", "transparan", "lapor tanpa ribet"];

const LOGO_TEXT = "Laporkuy";

const charVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0 } },
};

function TypewriterLogo() {
  const reduceMotion = useReducedMotion();

  return (
    <p className="auth__logo">
      <motion.span
        initial={reduceMotion ? false : "hidden"}
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: { staggerChildren: reduceMotion ? 0 : 0.12 },
          },
        }}
      >
        {LOGO_TEXT.split("").map((char, index) => (
          <motion.span key={index} variants={charVariants}>
            {char}
          </motion.span>
        ))}
        <motion.span className="brand__dot" variants={charVariants}>
          .
        </motion.span>
      </motion.span>
      {!reduceMotion && <span className="auth__caret" aria-hidden="true" />}
    </p>
  );
}

export default function Auth({ mode }) {
  const isLogin = mode === "login";
  const stageRef = useRef(null);
  const [error, setError] = useState("");
  const [busy,setBusy] = useState(false);
  const [demoAccounts,setDemoAccounts] = useState([]);
  const [googleEnabled,setGoogleEnabled] = useState(false);
  const formRef = useRef(null);
  useEffect(() => { fetch("/api/meta").then(r => r.json()).then(r => { setDemoAccounts(r.demo_accounts || []); setGoogleEnabled(Boolean(r.google_enabled)); }).catch(() => {}); },[]);
  function fillDemo(account) {
    formRef.current.elements.email.value = account.email;
    formRef.current.elements.password.value = account.password;
    setError("");
  }

  async function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    if (!isLogin && password !== String(data.get("password2") ?? "")) {
      setError("Password dan konfirmasi password tidak sama.");
      return;
    }
    setError("");
    const email = String(data.get("email") ?? "").trim();
    setBusy(true);
    try {
      const res = await fetch(isLogin ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: data.get("full_name") }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Request gagal");
        return;
      }
      if (isLogin) {
        localStorage.setItem("laporkuy_token", json.token);
        localStorage.setItem("laporkuy_user", JSON.stringify(json.user));
        const isStaff = ["admin", "pemerintah"].includes(json.user.role);
        window.location.href = isStaff ? "/pemerintah" : "/";
      } else {
        window.location.href = "/masuk";
      }
    } catch {
      setError("Tidak bisa menghubungi server.");
    } finally { setBusy(false); }
  }

  return (
    <div className="auth">
      <div className="auth__visual">
        <div
          className="auth__shade"
          aria-hidden="true"
          style={{ backgroundImage: `url(${shadeUrl})` }}
        />
        <TypewriterLogo />

        <div className="auth__cards" ref={stageRef}>
          {SLOGANS.map((slogan) => (
            <OrbitCard
              key={slogan}
              stageRef={stageRef}
              className="auth__slogan"
              label={`${slogan} — geser untuk memindahkan`}
            >
              {slogan}
            </OrbitCard>
          ))}
        </div>
      </div>

      <div className="auth__panel">
        <div className="auth__form-wrap">
          <h1 className="auth__title">{isLogin ? "Masuk" : "Daftar"}</h1>
          <p className="auth__sub">
            {isLogin
              ? "Masuk untuk membuat dan melacak laporan."
              : "Buat akun untuk mulai melapor."}
          </p>

          {isLogin && demoAccounts.length > 0 && <div className="lk-demo-accounts"><p>Isi formulir dengan akun demo:</p>{demoAccounts.map(a => <button type="button" key={a.email} onClick={() => fillDemo(a)}>{a.label}</button>)}</div>}
          <form ref={formRef} className="auth__form" onSubmit={onSubmit}>
            {!isLogin && <><label className="auth__label" htmlFor="auth-name">Nama lengkap</label><input className="auth__input" id="auth-name" name="full_name" autoComplete="name" maxLength={150} required /></>}
            <label className="auth__label" htmlFor="auth-email">Email</label>
            <input className="auth__input" id="auth-email" name="email" type="email" autoComplete="email" required />

            <label className="auth__label" htmlFor="auth-password">
              Password
            </label>
            <input
              className="auth__input"
              id="auth-password"
              name="password"
              type="password"
              minLength={isLogin ? undefined : 8}
              maxLength={256}
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
            />

            {!isLogin && (
              <>
                <label className="auth__label" htmlFor="auth-password2">
                  Password (ulangi)
                </label>
                <input
                  className="auth__input"
                  id="auth-password2"
                  name="password2"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </>
            )}

            {error && (
              <p className="auth__error" role="alert">
                {error}
              </p>
            )}

            <button className="btn btn--primary auth__submit" type="submit" disabled={busy}>
              {busy ? "Memproses..." : isLogin ? "Masuk" : "Daftar"}
            </button>
                    </form>

          <div className="auth__divider">
            <span>atau</span>
          </div>

          <button
            type="button"
            className="auth__google"
            disabled={busy}
            onClick={() => {
              if (!googleEnabled) { setError("Masuk dengan Google belum dikonfigurasi."); return; }
              window.location.href = "/api/auth/google";
            }}
          >
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt=""
                width="20"
                height="20"
                aria-hidden="true"
                style={{ display: "block", flexShrink: 0 }}
              />
            <span>
              {isLogin ? "Masuk dengan Google" : "Daftar dengan Google"}
            </span>
          </button>

          <p className="auth__alt">
            {isLogin ? (
              <>
                Belum punya akun? <a href="/daftar">Daftar</a>
              </>
            ) : (
              <>
                Sudah punya akun? <a href="/masuk">Masuk</a>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
