import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, auth, type HistoryRow, type LogRow } from "@/lib/api";

export const Route = createFileRoute("/logs")({
  component: LogsPage,
  head: () => ({
    meta: [
      { title: "Logs & History — SnoreShift" },
      { name: "description", content: "Sleep session logs and historical events." },
    ],
  }),
});

function LogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const serial = auth.getSerial();
      if (!serial) {
        navigate({ to: "/auth" });
        return;
      }
      const [l, h] = await Promise.all([api.logs(), api.history(serial)]);
      setLogs(l);
      setHistory(h);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.isAuthed()) {
      navigate({ to: "/auth" });
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
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
              className="rounded-full px-3 py-1.5 text-sm text-slate-300 hover:text-cyan-300"
            >
              Dashboard
            </Link>
            <Link to="/logs" className="rounded-full bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-300">
              Logs & History
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-sans text-2xl font-semibold text-white">Logs & History</h1>
            <p className="mt-1 text-sm text-slate-400">
              Event log and historical sleep stages for your device.
            </p>
          </div>
          <Button
            onClick={load}
            disabled={loading}
            variant="outline"
            className="rounded-full border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Event Log" count={logs.length}>
            <table className="w-full text-xs">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-medium">Time</th>
                  <th className="py-2 pr-3 font-medium">Event</th>
                  <th className="py-2 pr-3 font-medium">Action</th>
                  <th className="py-2 font-medium">Result</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {logs.map((l, i) => (
                  <tr key={i} className="border-t border-slate-800">
                    <td className="py-1.5 pr-3 text-slate-400">{l.time}</td>
                    <td className="py-1.5 pr-3 text-slate-200">{l.event}</td>
                    <td className="py-1.5 pr-3 text-cyan-300">{l.action}</td>
                    <td className="py-1.5 text-emerald-300">{l.result}</td>
                  </tr>
                ))}
                {logs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No events yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Section>

          <Section title="Sleep History" count={history.length}>
            <table className="w-full text-xs">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-medium">Timestamp</th>
                  <th className="py-2 pr-3 font-medium">Stage</th>
                  <th className="py-2 font-medium">Label</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {history.map((h, i) => (
                  <tr key={i} className="border-t border-slate-800">
                    <td className="py-1.5 pr-3 text-slate-400">{h.timestamp}</td>
                    <td className="py-1.5 pr-3 text-cyan-300">#{h.stage_num}</td>
                    <td className="py-1.5 text-slate-200">{h.label}</td>
                  </tr>
                ))}
                {history.length === 0 && !loading && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
                      No history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Section>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-sans text-base font-semibold text-white">{title}</h2>
        <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate-400">
          {count} rows
        </span>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">{children}</div>
    </section>
  );
}
