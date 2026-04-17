import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import pillowHero from "@/assets/pillow-hero.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSleepSocket } from "@/hooks/use-socket";
import FftChart from "@/components/FftChart";
import { Activity, Download, Wifi, WifiOff } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "SnoreShift — Real-Time Sleep Apnea Detection" },
      {
        name: "description",
        content:
          "AI-powered monitoring with real-time FFT visualization and snoring signature detection (100–300 Hz).",
      },
    ],
  }),
});

const DEFAULT_URL = "http://localhost:5000";

function fsrLabel(fsr: string) {
  if (fsr === "FSR_0") return { text: "Bed Empty", sub: "FSR: 0", active: false };
  return {
    text: "Monitoring Active",
    sub: `FSR: 1 (${fsr.replace("FSR_", "")})`,
    active: true,
  };
}

function Index() {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [pendingUrl, setPendingUrl] = useState(DEFAULT_URL);
  const [enabled, setEnabled] = useState(false);

  const { connected, fft, fsrState, status } = useSleepSocket(url, enabled);

  // Demo placeholder data so chart isn't empty before connection
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

  const handleConnect = () => {
    setUrl(pendingUrl);
    setEnabled(true);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `${url}/download_history`;
    link.setAttribute("download", "sleep_history.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // tiny live tick to keep chart re-render smooth even on demo
  const [, setTick] = useState(0);
  useEffect(() => {
    if (fft) return;
    const id = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(id);
  }, [fft]);

  return (
    <main className="min-h-screen bg-hero-gradient">
      {/* Nav */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/20 bg-background/60 backdrop-blur">
            <Activity className="h-4 w-4" />
          </div>
          <span className="text-xl font-semibold tracking-tight">SnoreShift</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="h-9 rounded-full px-4 text-sm font-medium">
            Sign in
          </Button>
          <Button className="h-9 rounded-full bg-foreground px-5 text-sm font-medium text-background hover:bg-foreground/90">
            Sign up
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-12 pt-8 lg:grid-cols-2 lg:gap-8 lg:pt-16">
        <div className="flex flex-col justify-center">
          <h1 className="text-5xl leading-[1.05] text-foreground md:text-6xl lg:text-7xl">
            Real-Time Sleep Apnea Detection
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Analyzing breathing and snoring
            <br />
            patterns through sound.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="h-12 rounded-full border-foreground/20 bg-background/70 px-6 backdrop-blur"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Sleep History
            </Button>
          </div>
        </div>

        {/* Brain image with floating pills */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 -z-10 rounded-full bg-accent/30 blur-3xl" />
          <img
            src={pillowHero}
            alt="Guardian's Pillow — smart anti-snoring sleep device"
            width={1024}
            height={1024}
            className="float-slow w-full max-w-md drop-shadow-[0_25px_60px_oklch(0.65_0.22_350/0.3)]"
          />
          <FloatingPill className="left-2 top-10 md:left-6" label="Guardian's Pillow" />
          <FloatingPill className="right-2 top-24 md:right-4" label="Smart Sensors" />
          <FloatingPill className="bottom-16 left-1/4" label="Real-time power" />
        </div>
      </section>

      {/* Live monitor */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft backdrop-blur md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Live Spectrum
              </div>
              <h2 className="mt-1 text-2xl text-foreground md:text-3xl">
                Real-time FFT Monitor
              </h2>
            </div>

            <div className="flex items-center gap-3 rounded-full border border-border bg-background/80 px-4 py-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  fsr.active ? "bg-success pulse-dot" : "bg-muted-foreground/40"
                }`}
              />
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-foreground">{fsr.text}</span>
                <span className="text-[11px] text-muted-foreground">{fsr.sub}</span>
              </div>
            </div>
          </div>

          <div className="h-[420px] w-full">
            <FftChart
              frequencies={chartData.frequencies}
              magnitudes={chartData.magnitudes}
            />
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat
              label="Dominant Freq"
              value={fft?.dominant_hz != null ? `${fft.dominant_hz.toFixed(1)} Hz` : "—"}
            />
            <Stat
              label="Energy"
              value={fft?.energy != null ? fft.energy.toFixed(3) : "—"}
            />
            <Stat label="Snore Count" value={status?.snore_count?.toString() ?? "0"} />
            <Stat label="Session" value={status?.session_time ?? "00:00:00"} />
          </div>

          {!enabled && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Showing demo spectrum. Enter your backend URL above and click Connect to stream live
              FFT data.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function FloatingPill({ className, label }: { className?: string; label: string }) {
  return (
    <div
      className={`absolute flex items-center gap-2 rounded-full bg-pill-gradient px-3 py-1.5 text-xs font-medium shadow-soft backdrop-blur ${className ?? ""}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-signature" />
      {label}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
      <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
