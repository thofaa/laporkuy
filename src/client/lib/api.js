export async function api(path, options = {}) {
  const token = localStorage.getItem("laporkuy_token");
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    });
  } catch { throw new Error("Server tidak dapat dihubungi. Periksa apakah bun dev masih berjalan."); }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || "Permintaan gagal. Coba kembali.");
    error.status = response.status;
    if (response.status === 401) {
      localStorage.removeItem("laporkuy_token");
      localStorage.removeItem("laporkuy_user");
    }
    throw error;
  }
  return result;
}
export function currentAccount() {
  try { return JSON.parse(localStorage.getItem("laporkuy_user") || "null"); }
  catch { return null; }
}
export function loginURL() {
  return `/masuk?next=${encodeURIComponent(location.pathname + location.search)}`;
}
