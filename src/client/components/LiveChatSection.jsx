import { useEffect, useRef } from "react";
import { motion, useMotionValue, useReducedMotion } from "framer-motion";
import ChatPieChart from "./ChatPieChart.jsx";
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

function DraggableMessage({ message, stageRef }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const angleRef = useRef(Math.random() * Math.PI * 2);
  // arah acak per pesan: searah atau berlawanan jarum jam
  const speedRef = useRef(
    (0.1 + Math.random() * 0.05) * (Math.random() < 0.5 ? -1 : 1)
  );
  const draggingRef = useRef(false);
  const orbitRef = useRef(null);

  // gerak melingkar terus-menerus di dalam stage
  useEffect(() => {
    if (reduceMotion) return;
    const stage = stageRef.current;
    const el = ref.current;
    if (!stage || !el) return;
    const stageRect = stage.getBoundingClientRect();
    const minX = -el.offsetLeft;
    const maxX = stageRect.width - el.offsetLeft - el.offsetWidth;
    const minY = -el.offsetTop;
    const maxY = stageRect.height - el.offsetTop - el.offsetHeight;
    const radius =
      Math.min((maxX - minX) / 2, (maxY - minY) / 2) *
      (0.55 + Math.random() * 0.35);
    orbitRef.current = {
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2,
      radius,
      minX,
      maxX,
      minY,
      maxY,
    };

    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const orbit = orbitRef.current;
      if (!draggingRef.current && orbit) {
        angleRef.current += speedRef.current * dt;
        x.set(orbit.cx + orbit.radius * Math.cos(angleRef.current));
        y.set(orbit.cy + orbit.radius * Math.sin(angleRef.current));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, stageRef, x, y]);

  // panah menggeser 10px, Shift+panah 40px, dibatasi ke dalam stage
  function onKeyDown(event) {
    const steps = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    const distance = event.shiftKey ? 40 : 10;
    const stage = stageRef.current?.getBoundingClientRect();
    const el = ref.current;
    if (!stage || !el) return;
    const minX = -el.offsetLeft;
    const maxX = stage.width - el.offsetLeft - el.offsetWidth;
    const minY = -el.offsetTop;
    const maxY = stage.height - el.offsetTop - el.offsetHeight;
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
    x.set(clamp(x.get() + step[0] * distance, minX, maxX));
    y.set(clamp(y.get() + step[1] * distance, minY, maxY));
  }

  return (
    <motion.div
      ref={ref}
      className="live-chat__message"
      drag
      dragConstraints={stageRef}
      dragMomentum={false}
      dragElastic={0}
      style={{ x, y }}
      whileDrag={reduceMotion ? undefined : { scale: 1.01 }}
      tabIndex={0}
      aria-label={`Laporan ${message.user} ${message.date} — geser untuk memindahkan`}
      onKeyDown={onKeyDown}
      onDragStart={() => {
        draggingRef.current = true;
      }}
      onDragEnd={() => {
        const orbit = orbitRef.current;
        if (orbit) {
          const clampCenter = (v, min, max, r) =>
            Math.min(max - r, Math.max(min + r, v));
          const cx = clampCenter(x.get(), orbit.minX, orbit.maxX, orbit.radius);
          const cy = clampCenter(y.get(), orbit.minY, orbit.maxY, orbit.radius);
          orbitRef.current = { ...orbit, cx, cy };
          angleRef.current = Math.atan2(y.get() - cy, x.get() - cx);
        }
        draggingRef.current = false;
      }}
    >
      <div className="live-chat__header">
        <span className="live-chat__user">{message.user}</span>
        <time dateTime={message.iso}>{message.date}</time>
      </div>
      <p className="live-chat__text">{message.text}</p>
    </motion.div>
  );
}

export default function LiveChatSection() {
  const stageRef = useRef(null);

  return (
    <section className="live-chat" id="live-chat">
      <div className="container">
        <div className="section__head">
          <h2 className="section__title">Tanya langsung</h2>
            <p className="section__sub">
            Lihat apa yang banyak dikeluhin warga ...
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
              <DraggableMessage
                key={message.date}
                message={message}
                stageRef={stageRef}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
