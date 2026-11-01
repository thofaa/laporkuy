import { useEffect, useState } from "react";
export default function DemoBanner() {
  const [demo,setDemo] = useState(false);
  useEffect(() => { fetch("/api/meta").then(r => r.json()).then(r => setDemo(r.demo)).catch(() => {}); },[]);
  return demo ? <div className="lk-demo" role="status"><strong>MODE DEMO</strong> — seluruh data adalah contoh dan direset saat server dimulai ulang. <a href="/masuk">Coba akun demo</a></div> : null;
}
