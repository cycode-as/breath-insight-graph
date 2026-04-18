import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

export type FftPayload = {
  frequencies: number[];
  magnitudes: number[];
  dominant_hz?: number;
  energy?: number;
  timestamp?: string;
};

export type StatusPayload = {
  status?: string;
  fsr_state?: string;
  snore_count?: number;
  inflation_level?: number;
  session_time?: string;
  last_action?: string;
  cpu_usage?: number;
};

export function useSleepSocket(url: string, enabled: boolean) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [fft, setFft] = useState<FftPayload | null>(null);
  const [fsrState, setFsrState] = useState<string>("FSR_0");
  const [status, setStatus] = useState<StatusPayload | null>(null);

  useEffect(() => {
    if (!enabled || !url) return;
    const socket = io(url, { transports: ["websocket", "polling"], reconnection: true });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("fft_update", (data: FftPayload) => setFft(data));
    socket.on("fsr_update", (data: { fsr: string }) => setFsrState(data?.fsr ?? "FSR_0"));
    socket.on("status_update", (data: StatusPayload) => {
      setStatus(data);
      if (data?.fsr_state) setFsrState(data.fsr_state);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [url, enabled]);

  return { connected, fft, fsrState, status };
}
