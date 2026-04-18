// Backend base URL (Flask + Socket.IO)
export const API_BASE = "http://localhost:5000";

export type LoginResponse = { serial_id: string; [k: string]: unknown };
export type LogRow = { time: string; event: string; action: string; result: string };
export type HistoryRow = { timestamp: string; stage_num: number; label: string };
export type SystemStatus = {
  status?: string;
  fsr_state?: string;
  snore_count?: number;
  inflation_level?: number;
  session_time?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  login: (username: string, password: string) =>
    request<LoginResponse>("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  register: (username: string, password: string) =>
    request<{ ok?: boolean; message?: string }>("/api/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  status: () => request<SystemStatus>("/api/status"),
  logs: () => request<LogRow[]>("/api/logs"),
  history: (serialId: string) =>
    request<HistoryRow[]>(`/api/history?serial_id=${encodeURIComponent(serialId)}`),
  testSnore: () => fetch(`${API_BASE}/test/snore`).then((r) => r.ok),
  testApnea: () => fetch(`${API_BASE}/test/apnea`).then((r) => r.ok),
};

const SERIAL_KEY = "serial_id";
export const auth = {
  getSerial: () => (typeof window === "undefined" ? null : localStorage.getItem(SERIAL_KEY)),
  setSerial: (id: string) => localStorage.setItem(SERIAL_KEY, id),
  clear: () => localStorage.removeItem(SERIAL_KEY),
  isAuthed: () =>
    typeof window !== "undefined" && Boolean(localStorage.getItem(SERIAL_KEY)),
};
