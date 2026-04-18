// Lightweight REST helpers for the Guardian's Pillow Flask backend.
// Base URL is persisted so users can override the default localhost:5000.

const BASE_KEY = "snoreshift.baseUrl";
const SERIAL_KEY = "snoreshift.serialId";
const USER_KEY = "snoreshift.username";

export const DEFAULT_BASE_URL = "http://localhost:5000";

export function getBaseUrl(): string {
  if (typeof window === "undefined") return DEFAULT_BASE_URL;
  return localStorage.getItem(BASE_KEY) || DEFAULT_BASE_URL;
}

export function setBaseUrl(url: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BASE_KEY, url);
}

export function getSerialId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SERIAL_KEY);
}

export function setSerialId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SERIAL_KEY, id);
}

export function getUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_KEY);
}

export function setUsername(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, name);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SERIAL_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type LoginResponse = {
  serial_id: string;
  history?: HistoryItem[];
};

export type HistoryItem = {
  timestamp: string;
  stage_num: number;
  label: string;
};

export type LogItem = {
  time: string;
  event: string;
  action: string;
  result: string;
};

export const api = {
  login: (username: string, password: string) =>
    request<LoginResponse>("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  register: (username: string, password: string) =>
    request<{ serial_id?: string; message?: string }>("/api/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  status: () => request<Record<string, unknown>>("/api/status"),
  logs: () => request<LogItem[]>("/api/logs"),
  history: (serialId: string) =>
    request<HistoryItem[]>(`/api/history?serial_id=${encodeURIComponent(serialId)}`),
  testSnore: () => request<{ ok?: boolean }>("/test/snore"),
  testApnea: () => request<{ ok?: boolean }>("/test/apnea"),
};
