import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { api, getBaseUrl, getSerialId, type HistoryItem, type LogItem } from "@/lib/api";
import { useSleepSocket } from "@/hooks/use-socket";

export const Route = createFileRoute("/logs")({
  component: LogsPage,
  head: () => ({
    meta: [
      { title: "Logs & History — SnoreShift" },
      { name: "description", content: "Live event diary and historical sleep stages from Guardian's Pillow." },
    ],
  }),
});

type Tab = "live" | "history";

function LogsPage() {
  const navigate = useNavigate();
  const [serial, setSerial] = useState<string | null>(null);
  const [url] = useState(getBaseUrl());
  const [tab, setTab] = useState<Tab>("live");
  const [initialLogs, setInitialLogs] = useState<LogItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = getSerialId();
    if (!id) {
      navigate({ to: "/auth" });
      return;
    }
    setSerial(id);
  }, [navigate]);

  const { logs: liveLogs } = useSleepSocket(url, !!serial);

  useEffect(() => {
    if (!serial) return;
    setLoading(true);
    setError(null);
    Promise.all([api.logs().catch(() => []), api.history(serial).catch(() => [])])
      .then(([l, h]) => {
        setInitialLogs(Array.isArray(l) ? l : []);
        setHistory(Array.isArray(h) ? h : []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [serial]);

  const merged = useMemo(() => {
    const seen = new Set<string>();
    const all = [...liveLogs, ...initialLogs];
    return all.filter((row) => {
      const key = `${row.time}|${row.event}|${row.action}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [liveLogs, initialLogs]);

  if (!serial) return null;

  return (
    <main className="min-h-screen bg-hero-gradient">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Activity</div>
            <h1 className="mt-1 text-3xl text-foreground md:text-4xl">Logs & Sleep History</h1>
          </div>
          <div className="flex rounded-full border border-border bg-background/70 p-1">
            {(["live", "history"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  tab === t ? "bg-foreground text-background shadow-soft" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "live" ? "Live Events" : "History"}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card/80 p-2 shadow-soft backdrop-blur md:p-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          )}
          {error && !loading && (
            <div className="m-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {!loading && tab === "live" && <LogsTable rows={merged} />}
          {!loading && tab === "history" && <HistoryTable rows={history} />}
        </div>

        <div className="mt-4 text-right">
          <Button asChild variant="outline" className="h-10 rounded-full border-foreground/20 bg-background/70 backdrop-blur">
            <a href={`${url}/download_history`}>Download Sleep History (CSV)</a>
          </Button>
        </div>
      </section>
    </main>
  );
}

function LogsTable({ rows }: { rows: LogItem[] }) {
  if (!rows.length) {
    return <div className="px-4 py-12 text-center text-sm text-muted-foreground">No events yet.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Event</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.time}-${i}`} className="border-t border-border/60 hover:bg-background/50">
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.time}</td>
              <td className="px-4 py-3 font-medium text-foreground">{r.event}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.action}</td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-border bg-background/70 px-2.5 py-0.5 text-xs">{r.result}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryTable({ rows }: { rows: HistoryItem[] }) {
  if (!rows.length) {
    return <div className="px-4 py-12 text-center text-sm text-muted-foreground">No history yet.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            <th className="px-4 py-3">Timestamp</th>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3">Label</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.timestamp}-${i}`} className="border-t border-border/60 hover:bg-background/50">
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.timestamp}</td>
              <td className="px-4 py-3 font-mono text-xs">{r.stage_num}</td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-signature/30 bg-signature-soft/40 px-2.5 py-0.5 text-xs font-medium">
                  {r.label}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
