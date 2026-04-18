import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Wifi, WifiOff, Wind, Zap } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import FftChart from "@/components/FftChart";
import { Button } from "@/components/ui/button";
import { useSleepSocket } from "@/hooks/use-socket";
import { api, getBaseUrl, getSerialId } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Live Dashboard — SnoreShift" },
      { name: "description", content: "Real-time monitoring of your Guardian's Pillow." },
    ],
  }),
});

function statusBadge(status?: string) {
  const s = (status || "IDLE").toUpperCase();
  const map: Record<string, string> = {
    APNEA: "bg-destructive/15 text-destructive border-destructive/30",
    INFLATING: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    SENSING: "bg-success/15 text-success border-success/30",
    VERIFYING: "bg-accent/30 text-accent-foreground border-accent/40",
    IDLE: "bg-muted text-muted-foreground border-border",
  };
  return map[s] || map.IDLE;
}

function fsrLabel(fsr: string) {
  if (fsr === "FSR_0") return { text: "Bed Empty", sub: "FSR: 0", active: false };
  return { text: "Monitoring Active", sub: `FSR: 1 (${fsr.replace("FSR_", "")})`, active: true };
}

function DashboardPage() {
  const navigate = useNavigate();
  const [serial, setSerial] = useState<string | null>(null);
  const [url] = useState(getBaseUrl());

  useEffect(() => {
    const id = getSerialId();
    if (!id) {
      navigate({ to: "/auth" });
      return;
    }
    setSerial(id);
  }, [navigate]);

  const { connected, fft, fsrState, status, apnea, countdown } = useSleepSocket(url, !!serial);

  const demo = useMemo(() => {
    const freqs = Array.from({ length: 128 }, (_, i) => i * 4);
    const mags = freqs.map((f) => {
      const snore = Math.exp(-Math.pow((f - 200) / 60, 2)) * 0.6;
      const noise = Math.exp(-f / 200) * 0.3;
      return +(snore + noise + Math.random() * 0.04).toFixed(3);
    });
    return { frequencies: freqs, magnitudes: mags };
  }, []);

  const chartData = fft ?? demo;
  const fsr = fsrLabel(fsrState);
  const sysStatus = status?.status || "IDLE";

  const triggerSnore = async () => {
    try { await api.testSnore(); } catch (e) { console.error(e); }
  };
  const triggerApnea = async () => {
    try { await api.testApnea(); } catch (e) { console.error(e); }
  };

  if (!serial) return null;

  return (
    <main className="min-h-screen bg-hero-gradient">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-6 pb-20">
        {/* Top bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Real-time Monitor
            </div>
            <h1 className="mt-1 text-3xl text-foreground md:text-4xl">Live Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs">
              {connected ? (
                <><Wifi className="h-3.5 w-3.5 text-success" /> Connected</>
              ) : (
                <><WifiOff className="h-3.5 w-3.5 text-muted-foreground" /> Offline</>
              )}
            </div>
            <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusBadge(sysStatus)}`}>
              {sysStatus}
            </span>
          </div>
        </div>

        {/* Apnea overlay */}
        {apnea && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-destructive shadow-soft">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Apnea event detected</div>
              <div className="text-xs opacity-80">
                {apnea.elapsed.toFixed(1)}s / {apnea.threshold}s threshold
              </div>
            </div>
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-destructive/20">
              <div
                className="h-full bg-destructive transition-all"
                style={{ width: `${Math.min(100, (apnea.elapsed / apnea.threshold) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Countdown bar */}
        {countdown && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card/80 px-5 py-3 shadow-soft backdrop-blur">
            <Loader2 className="h-4 w-4 animate-spin text-accent-foreground" />
            <div className="text-xs font-medium">Verifying snore signature… {countdown.seconds}s</div>
            <div className="ml-auto h-1.5 w-40 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-signature animate-[shrink_10s_linear]"
                style={{ width: "100%", animation: `dashShrink ${countdown.seconds}s linear forwards` }}
              />
            </div>
          </div>
        )}

        {/* Main chart card */}
        <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft backdrop-blur md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Live Spectrum
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
            <Stat label="Dominant Freq" value={fft?.dominant_hz != null ? `${fft.dominant_hz.toFixed(1)} Hz` : "—"} />
            <Stat label="Energy" value={fft?.energy != null ? fft.energy.toFixed(3) : "—"} />
            <Stat label="Snore Count" value={status?.snore_count?.toString() ?? "0"} />
            <Stat label="Session" value={status?.session_time ?? "00:00:00"} />
          </div>
        </div>

        {/* Secondary panels */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Panel title="Pillow Inflation">
            <InflationGauge level={status?.inflation_level ?? 0} />
          </Panel>
          <Panel title="Last Action">
            <div className="font-mono text-sm text-foreground">{status?.last_action ?? "—"}</div>
            <div className="mt-1 text-xs text-muted-foreground">CPU: {status?.cpu_usage?.toFixed?.(0) ?? "—"}%</div>
          </Panel>
          <Panel title="Quick Tests">
            <div className="flex flex-col gap-2">
              <Button onClick={triggerSnore} variant="outline" className="h-10 rounded-full border-foreground/20 bg-background/70 backdrop-blur">
                <Zap className="mr-2 h-4 w-4" /> Trigger Snore
              </Button>
              <Button onClick={triggerApnea} variant="outline" className="h-10 rounded-full border-foreground/20 bg-background/70 backdrop-blur">
                <Wind className="mr-2 h-4 w-4" /> Trigger Apnea
              </Button>
            </div>
          </Panel>
        </div>
      </section>

      <style>{`
        @keyframes dashShrink { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </main>
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-soft backdrop-blur">
      <div className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function InflationGauge({ level }: { level: number }) {
  const max = 3;
  return (
    <div className="flex items-end gap-2">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < level;
        return (
          <div
            key={i}
            className={`h-12 flex-1 rounded-md border ${filled ? "border-signature/40 bg-signature/30" : "border-border bg-background/60"}`}
            style={{ height: `${28 + i * 14}px` }}
          />
        );
      })}
      <div className="ml-2 font-mono text-sm text-foreground">{level}/{max}</div>
    </div>
  );
}
