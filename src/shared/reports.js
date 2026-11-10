export const STATUSES = {
  submitted: "Terkirim",
  needs_review: "Perlu ditinjau",
  routed: "Dirutekan",
  accepted: "Diterima",
  in_progress: "Sedang ditangani",
  resolved: "Selesai",
  merged: "Digabung",
};

export const SYSTEM_STATUSES = ["submitted", "needs_review", "merged"];

export function parseReport(raw = "") {
  const [title = "", ...rest] = String(raw).split("\n");
  const locationIndex = rest.findIndex((line) => line.startsWith("Lokasi: "));
  return {
    title,
    location: locationIndex < 0 ? "" : rest[locationIndex].slice(8).trim(),
    description: (locationIndex < 0 ? rest : rest.slice(locationIndex + 1)).join("\n").trim(),
  };
}

export function publicReport(row) {
  // Never serialize the raw complaint, reporter identity, or private attachments.
  return {
    ticket_number: row.ticket_number,
    title: row.public_title,
    location: row.public_location,
    description: row.description_redacted,
    status: row.status,
    progress_percent: row.progress_percent,
    dinas_name: row.dinas_name,
    submitted_at: row.submitted_at,
  };
}

export function canManage(user, report) {
  return user?.role === "admin" || (
    user?.role === "pemerintah" && Boolean(user.dinas_id) && user.dinas_id === report.dinas_id
  );
}

export function validateUpdate(body, report, user) {
  const status = body?.status;
  const progress = Number(body?.progress_percent);
  const note = String(body?.note ?? "").trim();
  if (!Object.hasOwn(STATUSES, status) || SYSTEM_STATUSES.includes(status)) return "Status tidak valid.";
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) return "Progres harus bilangan bulat 0–100.";
  if (status === "resolved" && progress !== 100) return "Laporan selesai harus memiliki progres 100%.";
  if (status !== "resolved" && progress === 100) return "Progres 100% hanya untuk laporan selesai.";
  if (!note || note.length > 3000) return "Isi tanggapan 1–3.000 karakter.";
  return null;
}
