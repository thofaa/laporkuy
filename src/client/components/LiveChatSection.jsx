import { useRef } from "react";
import ChatPieChart from "./ChatPieChart.jsx";
import OrbitCard from "./OrbitCard.jsx";
import shadeUrl from "../assets/shade.png";

const MESSAGES = [
  {
    user: "warga_****",
    date: "21 Okt 2026",
    iso: "2026-10-21",
    text: "Jl. Soekarno Hatta banyak lubang, sudah 2 minggu.",
  },
  {
    user: "warga_****",
    date: "20 Okt 2026",
    iso: "2026-10-20",
    text: "Sampah menumpuk di TPS Jl. Ijen, mulai berbau.",
  },
  {
    user: "warga_****",
    date: "19 Okt 2026",
    iso: "2026-10-19",
    text: "Lampu PJU mati di Jl. Semeru sejak dua minggu lalu.",
  },
];

export default function LiveChatSection() {
  const stageRef = useRef(null);

  return (
    <section className="live-chat" id="live-chat">
      <div className="container">
        <div className="section__head">
          <h2 className="section__title">Tanya langsung</h2>
          <p className="section__sub">
            Distribusi percakapan saat ini, ditambah laporan warga yang bisa
            digeser di dalam bingkai.
          </p>
        </div>

        <ChatPieChart />

        <div className="live-chat__stage" ref={stageRef}>
          <div
            className="live-chat__shade"
            aria-hidden="true"
            style={{ backgroundImage: `url(${shadeUrl})` }}
          />

          <div className="live-chat__message-area">
            {MESSAGES.map((message) => (
              <OrbitCard
                key={message.date}
                stageRef={stageRef}
                className="live-chat__message"
                label={`Laporan ${message.user} ${message.date} — geser untuk memindahkan`}
              >
                <div className="live-chat__header">
                  <span className="live-chat__user">{message.user}</span>
                  <time dateTime={message.iso}>{message.date}</time>
                </div>
                <p className="live-chat__text">{message.text}</p>
              </OrbitCard>
            ))}
          </div>

          <p className="live-chat__hint">Geser pesan untuk memindahkan</p>
        </div>
      </div>
    </section>
  );
}
