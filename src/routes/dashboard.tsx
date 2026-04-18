import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Gauge,
  LogOut,
  Stethoscope,
  Timer,
  Waves,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import FftChart from "@/components/FftChart";
import StatusBadge from "@/components/StatusBadge";
import { api, auth, API_BASE, type SystemStatus } from "@/lib/api";
import { useSleepSocket } from "@/hooks/use-socket";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — SnoreShift" },
      { name: "description", content: "Real-time monitoring of breathing and snoring." },
    ],
  }),
});

function Dashboard() {
  const navigate = useNavigate();
  const [initialStatus, setInitialStatus] = useState<SystemStatus | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!auth.isAuthed()) {
      navigate({ to: "/auth" });
      return;
    }
    setAuthed(true);
    api.status().then(setInitialStatus).catch(() => undefined);
  }, [navigate]);

  const { connected, fft, fsrState, status, liveLogs, apnea, countdown } = useSleepSocket(
    API_BASE,
    authed,
  );

  const merged = status ?? initialStatus ?? {};

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
  const fsrActive = fsrState !== "FSR_0";

  const handleLogout = () => {
    auth.clear();
    navigate({ to: "/auth" });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Critical apnea overlay */}
      {apnea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/70 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-2xl border border-red-500/60 bg-red-950/80 p-8 text-center shadow-[0_0_60px_oklch(0.6_0.22_25/0.5)]">
            <AlertTriangle className="mx-auto h-12 w-12 animate-pulse text-red-400" />
            <h2 className="mt-4 font-sans text-2xl font-bold text-red-200">Apnea Detected</h2>
            <p className="mt-2 text-sm text-red-300">
              Elapsed: <span className="font-mono">{apnea.elapsed.toFixed(1)}s</span> / threshold{" "}
              <span className="font-mono">{apnea.threshold}s</span>
            </p>
            <Progress
              value={Math.min(100, (apnea.elapsed / apnea.threshold) * 100)}
              className="mt-4 bg-red-900"
            />
          </div>
        </div>
      )}

      {/* Nav */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900">
              <Activity className="h-4 w-4 text-cyan-400" />
            </div>
            <span className="font-sans text-lg font-semibold tracking-tight text-white">
              SnoreShift
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="rounded-full px-3 py-1.5 text-sm text-cyan-300"
              activeProps={{ className: "bg-cyan-500/10" }}
            >
              Dashboard
            </Link>
            <Link
              to="/logs"
              className="rounded-full px-3 py-1.5 text-sm text-slate-300 hover:text-cyan-300"
            >
              Logs & History
            </Link>
            <span
              className={`ml-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                connected
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-slate-700 bg-slate-900 text-slate-400"
              }`}
            >
              {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {connected ? "Live" : "Offline"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="ml-1 h-8 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="mr-1 h-3.5 w-3.5" />
              Sign out
            </Button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Top row: status panel */}
        <section className="grid gap-4 md:grid-cols-4">
          <StatusCard
            icon={<Stethoscope className="h-4 w-4" />}
            label="System"
            value={
              <StatusBadge status={merged.status ?? "IDLE"} />
            }
          />
          <StatusCard
            icon={<Gauge className="h-4 w-4" />}
            label="Bed Occupancy"
            value={
              <span className={fsrActive ? "text-emerald-400" : "text-slate-500"}>
                {fsrActive ? `Occupied (${fsrState})` : "Empty"}
              </span>
            }
          />
          <StatusCard
            icon={<Waves className="h-4 w-4" />}
            label="Inflation"
            value={
              <div className="flex flex-col gap-1">
                <span className="font-mono text-sm">
                  {merged.inflation_level ?? 0}%
                </span>
                <Progress value={merged.inflation_level ?? 0} className="h-1.5 bg-slate-800" />
              </div>
            }
          />
          <StatusCard
            icon={<Timer className="h-4 w-4" />}
            label="Session"
            value={
              <span className="font-mono text-sm">{merged.session_time ?? "00:00:00"}</span>
            }
          />
        </section>

        {/* Countdown */}
        {countdown && (
          <div className="mt-4 rounded-xl border border-orange-500/40 bg-orange-500/10 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-orange-300">Inflation countdown</span>
              <span className="font-mono text-orange-200">{countdown.seconds}s</span>
            </div>
            <Progress value={100} className="h-1.5 bg-orange-950 [&>div]:bg-orange-400" />
          </div>
        )}

        {/* FFT visualizer */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-widest text-slate-400">
                Live Spectrum
              </div>
              <h2 className="mt-1 font-sans text-xl font-semibold text-white">
                Real-time FFT Monitor
              </h2>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
              <Stat label="Dominant" value={fft?.dominant_hz ? `${fft.dominant_hz.toFixed(1)} Hz` : "—"} />
              <Stat label="Energy" value={fft?.energy != null ? fft.energy.toFixed(3) : "—"} />
              <Stat label="Snores" value={(merged.snore_count ?? 0).toString()} />
            </div>
          </div>
          <div className="h-[380px] w-full">
            <FftChart frequencies={chartData.frequencies} magnitudes={chartData.magnitudes} />
          </div>
        </section>

        {/* Test controls + recent events */}
        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h3 className="font-sans text-base font-semibold text-white">Hardware Tests</h3>
            <p className="mt-1 text-xs text-slate-400">
              Trigger backend test routines.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                onClick={() => api.testSnore()}
                className="h-10 rounded-full bg-amber-500/90 text-slate-950 hover:bg-amber-400"
              >
                Trigger Snore Test
              </Button>
              <Button
                onClick={() => api.testApnea()}
                className="h-10 rounded-full bg-red-500/90 text-white hover:bg-red-500"
              >
                Trigger Apnea Test
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-sans text-base font-semibold text-white">Live Events</h3>
              <Link to="/logs" className="text-xs text-cyan-400 hover:underline">
                View all →
              </Link>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {liveLogs.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">
                  Waiting for events…
                </p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-left text-slate-500">
                    <tr>
                      <th className="py-1.5 pr-3 font-medium">Time</th>
                      <th className="py-1.5 pr-3 font-medium">Event</th>
                      <th className="py-1.5 pr-3 font-medium">Action</th>
                      <th className="py-1.5 font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {liveLogs.slice(0, 8).map((l, i) => (
                      <tr key={i} className="border-t border-slate-800">
                        <td className="py-1.5 pr-3 text-slate-400">{l.time}</td>
                        <td className="py-1.5 pr-3 text-slate-200">{l.event}</td>
                        <td className="py-1.5 pr-3 text-cyan-300">{l.action}</td>
                        <td className="py-1.5 text-emerald-300">{l.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-slate-400">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm">{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
      <span className="font-mono text-sm text-slate-200">{value}</span>
    </div>
  );
}
