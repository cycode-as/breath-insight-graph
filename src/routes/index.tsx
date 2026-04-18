import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import pillowHero from "@/assets/pillow-hero.png";
import { Button } from "@/components/ui/button";
import { useSleepSocket } from "@/hooks/use-socket";
import FftChart from "@/components/FftChart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Activity, Download, Wind, BedDouble, Zap, FlaskConical,
  LogOut, Clock, AlertTriangle, CheckCircle2, Layers, Cpu,
  RefreshCw, WifiOff,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "SnoreShift" },
      { name: "description", content: "AI-powered monitoring with real-time FFT visualization and snoring signature detection (100-300 Hz)." },
    ],
  }),
});

const BASE_URL = "http://localhost:5000";

function fsrLabel(fsr: string) {
  if (fsr === "FSR_0") return { text: "Bed Empty", sub: "FSR: 0", active: false };
  return { text: "Monitoring Active", sub: `FSR: 1 (${fsr.replace("FSR_", "")})`, active: true };
}

const STATUS_META: Record<string, { color: string; icon: React.ReactNode }> = {
  SENSING:   { color: "bg-success/15 text-success border-success/30",         icon: <Activity className="h-3.5 w-3.5" /> },
  INFLATING: { color: "bg-blue-500/15 text-blue-500 border-blue-500/30",      icon: <Wind className="h-3.5 w-3.5" /> },
  APNEA:     { color: "bg-destructive/15 text-destructive border-destructive/30", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  IDLE:      { color: "bg-muted text-muted-foreground border-border",          icon: <BedDouble className="h-3.5 w-3.5" /> },
};
function statusMeta(s?: string) { return STATUS_META[s ?? ""] ?? STATUS_META["IDLE"]; }

function useCountdownProgress(seconds: number | null, onDone: () => void) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (seconds === null) { setElapsed(0); if (ref.current) clearInterval(ref.current); return; }
    setElapsed(0);
    ref.current = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= seconds) { clearInterval(ref.current!); onDone(); return seconds; }
        return e + 1;
      });
    }, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [seconds]);
  return { elapsed, pct: seconds ? Math.round((elapsed / seconds) * 100) : 0 };
}

function Index() {
  const navigate = useNavigate();
  const serialId = typeof window !== "undefined" ? localStorage.getItem("serial_id") : null;

  // Auth guard — restore when done previewing
  useEffect(() => {
    if (!serialId) navigate({ to: "/login" });
  }, [serialId]);

  const { connected, fft, fsrState, status, logs, apneaTimer, countdown, setApneaTimer, setCountdown } =
    useSleepSocket(BASE_URL, !!serialId);

  // track first-ever connection to distinguish "connecting" vs "offline"
  const [everConnected, setEverConnected] = useState(false);
  useEffect(() => { if (connected) setEverConnected(true); }, [connected]);

  // demo data for chart before live data arrives
  const demo = useMemo(() => {
    const freqs = Array.from({ length: 128 }, (_, i) => i * 4);
    const mags = freqs.map((f) => {
      const snore = Math.exp(-Math.pow((f - 200) / 60, 2)) * 0.6;
      const noise = Math.exp(-f / 200) * 0.3;
      return +(snore + noise + Math.random() * 0.04).toFixed(3);
    });
    return { frequencies: freqs, magnitudes: mags };
  }, []);

  const [, setTick] = useState(0);
  useEffect(() => {
    if (fft) return;
    const id = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(id);
  }, [fft]);

  const chartData = fft ?? demo;
  const fsr = fsrLabel(fsrState);
  const sm = statusMeta(status?.status);
  const inflationLevel = status?.inflation_level ?? 0;

  // logs
  const [initLogs, setInitLogs] = useState<typeof logs>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  useEffect(() => {
    setLogsLoading(true);
    fetch(`${BASE_URL}/api/logs`)
      .then((r) => r.json())
      .then((d) => setInitLogs(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLogsLoading(false));
  }, []);
  const allLogs = logs.length ? logs : initLogs;

  // history
  const [history, setHistory] = useState<{ timestamp: string; stage_num: number; label: string }[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback((force = false) => {
    if (historyLoading) return;
    if (historyLoaded && !force) return;
    setHistoryLoading(true);
    fetch(`${BASE_URL}/api/history?serial_id=${encodeURIComponent(serialId ?? "")}`)
      .then((r) => r.json())
      .then((d) => { setHistory(Array.isArray(d) ? d : []); setHistoryLoaded(true); })
      .catch(() => setHistoryLoaded(true))
      .finally(() => setHistoryLoading(false));
  }, [serialId, historyLoaded, historyLoading]);

  const handleDownload = () => {
    const url = serialId
      ? `${BASE_URL}/download_history?serial_id=${encodeURIComponent(serialId)}`
      : `${BASE_URL}/download_history`;
    window.open(url, "_blank");
  };

  const handleLogout = () => { localStorage.removeItem("serial_id"); navigate({ to: "/login" }); };

  const triggerTest = (type: "snore" | "apnea") => {
    if (!connected) return;
    fetch(`${BASE_URL}/test/${type}`).catch(() => {});
  };

  const { elapsed: cdElapsed, pct: cdPct } = useCountdownProgress(
    countdown?.seconds ?? null, () => setCountdown(null),
  );

  // truncate serial id for nav chip
  const serialDisplay = serialId
    ? (serialId.length > 16 ? `${serialId.slice(0, 14)}...` : serialId)
    : null;

  const STAGE_COLORS: Record<string, string> = {
    Snoring: "bg-signature/20 text-signature border-signature/30",
    Silence: "bg-success/15 text-success border-success/30",
    Gasp:    "bg-destructive/15 text-destructive border-destructive/30",
    Speech:  "bg-blue-500/15 text-blue-500 border-blue-500/30",
  };

  return (
    <main className="min-h-screen bg-hero-gradient">
      {/* Apnea Alert Overlay */}
      {apneaTimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-3xl border border-destructive/40 bg-card p-8 shadow-glow text-center">
            <h3 className="text-2xl text-foreground">Apnea Detected</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              No breathing detected for{" "}
              <span className="font-semibold text-destructive">{apneaTimer.elapsed}s</span> / {apneaTimer.threshold}s threshold
            </p>
            <Progress value={Math.min((apneaTimer.elapsed / apneaTimer.threshold) * 100, 100)} className="mt-5 h-2 bg-destructive/20 [&>div]:bg-destructive" />
            <Button onClick={() => setApneaTimer(null)} className="mt-6 h-10 w-full rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Snore Verify Countdown */}
      {countdown && (
        <div className="fixed bottom-6 right-6 z-40 w-72 rounded-2xl border border-border bg-card/95 p-5 shadow-soft backdrop-blur">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-signature pulse-dot" />
            <span className="text-sm font-semibold text-foreground">Verifying Snore...</span>
            <span className="ml-auto font-mono text-xs text-muted-foreground">{(countdown.seconds ?? 10) - cdElapsed}s</span>
          </div>
          <Progress value={cdPct} className="h-1.5 bg-signature/20 [&>div]:bg-signature" />
        </div>
      )}

      {/* Nav */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/20 bg-background/60 backdrop-blur">
            <Activity className="h-4 w-4" />
          </div>
          <span className="text-xl font-semibold tracking-tight">SnoreShift</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Serial ID chip — truncated */}
          {serialDisplay && (
            <div className="hidden max-w-[160px] items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs backdrop-blur sm:flex">
              <Cpu className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="truncate font-mono text-muted-foreground">{serialDisplay}</span>
            </div>
          )}

          {/* Connection status — 3 states */}
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs backdrop-blur">
            <span className={`h-1.5 w-1.5 rounded-full ${
              connected ? "bg-success pulse-dot" :
              !everConnected ? "bg-yellow-400/80" :
              "bg-muted-foreground/40"
            }`} />
            <span className="text-muted-foreground">
              {connected ? "Live" : !everConnected ? "Connecting..." : "Offline"}
            </span>
          </div>

          {/* Sign out */}
          <Button onClick={handleLogout} className="h-9 rounded-full bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/85">
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-12 pt-8 lg:grid-cols-2 lg:gap-8 lg:pt-16">
        <div className="flex flex-col justify-center">
          <h1 className="text-5xl leading-[1.05] text-foreground md:text-6xl lg:text-7xl">
            Analyzing breathing and snoring<br />patterns through sound.
          </h1>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleDownload} variant="outline" className="h-12 rounded-full border-foreground/20 bg-background/70 px-6 backdrop-blur">
              <Download className="mr-2 h-4 w-4" />
              Download Sleep History
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="absolute inset-0 -z-10 rounded-full bg-accent/30 blur-3xl" />
          <img src={pillowHero} alt="Guardian's Pillow" width={1024} height={1024} className="float-slow w-full max-w-md drop-shadow-[0_25px_60px_oklch(0.65_0.22_350/0.3)]" />
          <FloatingPill className="left-2 top-10 md:left-6" label="Guardian's Pillow" />
          <FloatingPill className="right-2 top-24 md:right-4" label="Smart Sensors" />
          <FloatingPill className="bottom-16 left-1/4" label="Real-time power" />
        </div>
      </section>

      {/* Dashboard tabs */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <Tabs defaultValue="monitor">
          <TabsList className="mb-6 rounded-full border border-border bg-background/70 p-1 backdrop-blur">
            <TabsTrigger value="monitor" className="rounded-full px-5 text-sm">Live Monitor</TabsTrigger>
            <TabsTrigger value="logs" className="rounded-full px-5 text-sm">Event Diary</TabsTrigger>
            <TabsTrigger value="history" className="rounded-full px-5 text-sm" onClick={() => loadHistory()}>Sleep History</TabsTrigger>
          </TabsList>

          {/* Live Monitor */}
          <TabsContent value="monitor" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">

              {/* System Status */}
              <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft backdrop-blur">
                <div className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">System Status</div>
                <div className="space-y-3">
                  <MiniStat icon={<Clock className="h-3.5 w-3.5" />} label="Session" value={status?.session_time ?? "00:00:00"} />
                  <MiniStat icon={<BedDouble className="h-3.5 w-3.5" />} label="Bed" value={fsr.text} active={fsr.active} />
                  <MiniStat icon={<Activity className="h-3.5 w-3.5" />} label="Snore Count" value={status?.snore_count?.toString() ?? "0"} />
                  <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
                    <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                      <Layers className="h-3.5 w-3.5" />Inflation
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((lvl) => (
                        <span key={lvl} className={`h-2.5 w-2.5 rounded-full transition-colors ${inflationLevel >= lvl ? "bg-signature" : "bg-muted-foreground/20"}`} />
                      ))}
                      <span className="ml-1 font-mono text-sm font-semibold text-foreground">{inflationLevel}/3</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Tests */}
              <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft backdrop-blur">
                <div className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">Quick Tests</div>
                {!connected ? (
                  <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
                    <WifiOff className="h-3.5 w-3.5 shrink-0" />
                    Connect to the device to run tests
                  </div>
                ) : (
                  <p className="mb-5 mt-1 text-sm text-muted-foreground">
                    Trigger hardware test routines to verify sensor and inflation response.
                  </p>
                )}
                <div className="flex flex-col gap-3">
                  <Button onClick={() => triggerTest("snore")} disabled={!connected} variant="outline" className="h-11 w-full rounded-full border-foreground/20 bg-background/70 backdrop-blur disabled:opacity-40">
                    <FlaskConical className="mr-2 h-4 w-4" />Test Snore Detection
                  </Button>
                  <Button onClick={() => triggerTest("apnea")} disabled={!connected} className="h-11 w-full rounded-full bg-destructive/90 text-destructive-foreground hover:bg-destructive disabled:opacity-40">
                    <Zap className="mr-2 h-4 w-4" />Test Apnea Response
                  </Button>
                </div>
              </div>
            </div>

            {/* FFT Chart */}
            <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft backdrop-blur md:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Live Spectrum
                    {!connected && !fft && (
                      <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-medium text-yellow-600">
                        {everConnected ? "Reconnecting..." : "Demo data"}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1 text-2xl text-foreground md:text-3xl">Real-time FFT Monitor</h2>
                </div>
                <div className="flex items-center gap-3 rounded-full border border-border bg-background/80 px-4 py-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${fsr.active ? "bg-success pulse-dot" : "bg-muted-foreground/40"}`} />
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold text-foreground">{fsr.text}</span>
                    <span className="text-[11px] text-muted-foreground">{fsr.sub}</span>
                  </div>
                </div>
              </div>
              <div className="h-[420px] w-full">
                <FftChart frequencies={chartData.frequencies} magnitudes={chartData.magnitudes} />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat label="Dominant Freq" value={fft?.dominant_hz != null ? `${fft.dominant_hz.toFixed(1)} Hz` : "-"} />
                <Stat label="Energy" value={fft?.energy != null ? fft.energy.toFixed(3) : "-"} />
                <Stat label="Snore Count" value={status?.snore_count?.toString() ?? "0"} />
                <Stat label="Session" value={status?.session_time ?? "00:00:00"} />
              </div>
            </div>
          </TabsContent>

          {/* Event Diary */}
          <TabsContent value="logs">
            <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft backdrop-blur md:p-8">
              <div className="mb-6">
                <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Live Event Diary</div>
                <h2 className="mt-1 text-2xl text-foreground md:text-3xl">Session Logs</h2>
              </div>
              {logsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-signature" />
                  <p className="text-sm text-muted-foreground">Loading events...</p>
                </div>
              ) : allLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No events recorded yet.</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Events appear here in real time once the device is active.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        {["Time", "Event", "Action", "Result"].map((h) => (
                          <th key={h} className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-widest text-muted-foreground last:pr-0">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allLogs.map((log, i) => (
                        <tr key={i} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                          <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{log.time}</td>
                          <td className="py-3 pr-4 font-medium text-foreground">{log.event}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{log.action}</td>
                          <td className="py-3">
                            <span className="inline-flex items-center rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">{log.result}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Sleep History */}
          <TabsContent value="history">
            <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft backdrop-blur md:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Historical Data</div>
                  <h2 className="mt-1 text-2xl text-foreground md:text-3xl">Sleep Stages</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => loadHistory(true)} disabled={historyLoading} variant="outline" className="h-10 rounded-full border-foreground/20 bg-background/70 px-4 backdrop-blur">
                    <RefreshCw className={`mr-2 h-3.5 w-3.5 ${historyLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <Button onClick={handleDownload} variant="outline" className="h-10 rounded-full border-foreground/20 bg-background/70 px-5 backdrop-blur">
                    <Download className="mr-2 h-4 w-4" />Export CSV
                  </Button>
                </div>
              </div>

              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-signature" />
                  <p className="text-sm text-muted-foreground">Loading history...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <BedDouble className="mb-3 h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No sleep history found.</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">History is linked to your serial ID. Use Refresh to reload.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        {["Timestamp", "Stage", "Label"].map((h) => (
                          <th key={h} className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-widest text-muted-foreground last:pr-0">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr key={i} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                          <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{h.timestamp}</td>
                          <td className="py-3 pr-4 font-mono text-xs text-foreground">{h.stage_num}</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[h.label] ?? "bg-muted text-muted-foreground border-border"}`}>{h.label}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}

function FloatingPill({ className, label }: { className?: string; label: string }) {
  return (
    <div className={`absolute flex items-center gap-2 rounded-full bg-pill-gradient px-3 py-1.5 text-xs font-medium shadow-soft backdrop-blur ${className ?? ""}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-signature" />
      {label}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
      <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function MiniStat({ icon, label, value, active }: { icon: React.ReactNode; label: string; value: string; active?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {icon}{label}
      </div>
      <div className={`font-mono text-sm font-semibold ${active === false ? "text-muted-foreground" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
