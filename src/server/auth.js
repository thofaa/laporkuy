import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password, stored) {
  try {
    const [algorithm, salt, key] = String(stored).split(":");
    if (algorithm !== "scrypt" || !salt || !key) return false;
    const expected = Buffer.from(key, "hex");
    const actual = scryptSync(password, salt, 64);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch { return false; }
}

export function safeUser(user) {
  return { id: user.id, email: user.email, role: user.role, dinas_id: user.dinas_id, full_name: user.full_name };
}
