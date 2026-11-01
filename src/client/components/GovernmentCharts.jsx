import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../lib/api.js";
import { Notice } from "./ReportWidgets.jsx";

const URGENCY_LABEL = { rendah: "Rendah", sedang: "Sedang", tinggi: "Tinggi", darurat: "Darurat" };
const URGENCY_COLORS = { rendah: "#b8b8b8", sedang: "#8a8a8a", tinggi: "#3d3d3d", darurat: "#1e1e1e", unknown: "#d6d6d6" };

const reduceMotion =
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

function shortLabel(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" });
}

function ChartTooltip({ active, payload, suffix }) {
  if (!active || !payload?.length) return null;
  const label = shortLabel(payload[0].payload?.label ?? payload[0].name ?? "");
  return <div className="chart-tooltip"><strong>{label}</strong><span>{payload[0].value} {suffix}</span></div>;
}

export default function GovernmentCharts() {
  const [group, setGroup] = useState("day");
  const [range, setRange] = useState("month");
  const [state, setState] = useState({ status: "loading", bar: [], pie: [], retry: 0 });

  const load = useCallback(() => {
    setState(s => ({ ...s, status: "loading" }));
    api(`/government/stats?group=${group}&range=${range}`)
      .then(json => {
        setState({ status: "ok", bar: json.bar ?? [], pie: json.pie ?? [], retry: 0 });
      })
      .catch(e => setState(s => ({ ...s, status: "error", error: e.message })));
  }, [group, range]);

  useEffect(() => { load(); }, [load]);

  const total = state.pie.reduce((sum, d) => sum + d.value, 0);
  const pie = state.pie.map(d => ({
    ...d,
    label: `${URGENCY_LABEL[d.name] ?? d.name} · ${total ? Math.round((d.value / total) * 100) : 0}%`,
  }));

  return (
    <>
      {state.status === "loading" && <Notice>Memuat statistik...</Notice>}
      {state.status === "error" && <Notice error>{state.error} <button className="lk-inline-button" onClick={load}>Coba lagi</button></Notice>}
      {state.status === "ok" && (
        <div className="overview-grid">
          <section className="chart-card">
            <div className="chart-card__head">
              <h2 className="chart-card__title">Laporan masuk</h2>
              <div className="overview-controls">
                <label className="overview-control-field">
                  Periode
                  <select className="overview-control" value={group} onChange={e => setGroup(e.target.value)}>
                    <option value="day">Hari</option>
                    <option value="week">Minggu</option>
                    <option value="month">Bulan</option>
                  </select>
                </label>
                <label className="overview-control-field">
                  Rentang
                  <select className="overview-control" value={range} onChange={e => setRange(e.target.value)}>
                    <option value="week">Seminggu</option>
                    <option value="month">Sebulan</option>
                    <option value="year">Setahun</option>
                  </select>
                </label>
              </div>
            </div>
            {state.bar.length === 0
              ? <Notice>Belum ada laporan pada rentang ini.</Notice>
              : <div className="chart-card__wrap" role="img" aria-label={`Grafik jumlah laporan masuk per periode: ${state.bar.map(b => `${b.label}: ${b.count}`).join(", ")}`}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={state.bar}>
                    <CartesianGrid stroke="#ddd" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickFormatter={shortLabel} tick={{ fontSize: 13, fill: "#6b6b6b" }} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: "#6b6b6b" }} />
                    <Tooltip content={<ChartTooltip suffix="laporan" />} cursor={{ fill: "#f4f4f4" }} />
                    <Bar dataKey="count" name="Laporan" fill="#1e1e1e" isAnimationActive={!reduceMotion} />
                  </BarChart>
                </ResponsiveContainer>
              </div>}
          </section>

          <section className="chart-card">
            <h2 className="chart-card__title">Tingkat kekritisan</h2>
            {state.pie.length === 0
              ? <Notice>Belum ada laporan.</Notice>
              : <div className="chart-card__wrap" role="img" aria-label={`Grafik persentase laporan per tingkat kekritisan: ${pie.map(p => p.label).join(", ")}`}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={pie} dataKey="value" nameKey="name" isAnimationActive={!reduceMotion} animationDuration={600} stroke="#ffffff" strokeWidth={1.5}>
                      {pie.map(entry => <Cell key={entry.name} fill={URGENCY_COLORS[entry.name] ?? "#d6d6d6"} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip suffix="laporan" />} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="chat-pie__legend">
                  {pie.map(entry => <li key={entry.name}><span className="chat-pie__swatch" style={{ background: URGENCY_COLORS[entry.name] ?? "#d6d6d6" }} aria-hidden="true" />{entry.label}</li>)}
                </ul>
              </div>}
          </section>
        </div>
      )}
    </>
  );
}
