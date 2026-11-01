import { useCallback, useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  Resolved: "#1e1e1e",
  Active: "#6b6b6b",
  Waiting: "#c4c4c4",
  Escalated: "#ffffff",
};

function summarize(data) {
  return data.map((d) => `${d.name} ${d.value}`).join(", ");
}

export default function ChatPieChart() {
  const [state, setState] = useState({ status: "loading", data: [] });

  const load = useCallback(() => {
    setState({ status: "loading", data: [] });
    fetch("/api/chat-stats")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((json) => {
        const data = Array.isArray(json.data) ? json.data : [];
        const total = data.reduce((sum, d) => sum + d.value, 0);
        setState({ status: total === 0 ? "empty" : "ok", data });
      })
      .catch(() => setState({ status: "error", data: [] }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = state.data.reduce((sum, d) => sum + d.value, 0);
  const chart = state.data.map((d) => ({
    ...d,
    label: `${d.name} · ${Math.round((d.value / total) * 100)}%`,
  }));

  function renderTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    return (
      <div className="chat-pie__tooltip">
        <strong>{payload[0].payload.label}</strong>
        <span>{payload[0].value} laporan</span>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="chat-pie chat-pie--skeleton" aria-busy="true">
        <span className="chat-pie__skeleton-circle" />
        <span className="visually-hidden">Memuat data laporan…</span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="chat-pie chat-pie--notice" role="alert">
        <p>Data laporan gagal dimuat.</p>
        <button type="button" className="chat-pie__retry" onClick={load}>
          Coba lagi
        </button>
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <div className="chat-pie chat-pie--notice" role="status">
        <p>Belum ada data laporan.</p>
      </div>
    );
  }

  const reduceMotion =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      className="chat-pie"
      role="img"
      aria-label={`Grafik distribusi status laporan: ${summarize(state.data)}`}
    >
      <ResponsiveContainer
        width="100%"
        height={360}
        className="chat-pie__chart"
      >
        <PieChart>
          <Pie
            data={chart}
            dataKey="value"
            nameKey="name"
            isAnimationActive={!reduceMotion}
            animationDuration={600}
            stroke="#1e1e1e"
            strokeWidth={1.2}
          >
            {chart.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip content={renderTooltip} />
        </PieChart>
      </ResponsiveContainer>

      <ul className="chat-pie__legend">
        {chart.map((entry) => (
          <li key={entry.name}>
            <span
              className="chat-pie__swatch"
              style={{ background: COLORS[entry.name] }}
              aria-hidden="true"
            />
            {entry.label}
          </li>
        ))}
      </ul>

      <table className="visually-hidden">
        <caption>Distribusi status laporan</caption>
        <thead>
          <tr>
            <th scope="col">Status</th>
            <th scope="col">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {state.data.map((d) => (
            <tr key={d.name}>
              <td>{d.name}</td>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
