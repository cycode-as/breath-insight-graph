import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, auth } from "@/lib/api";
import { Activity, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — SnoreShift" },
      { name: "description", content: "Sign in to your SnoreShift dashboard." },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        await api.register(username, password);
      }
      const res = await api.login(username, password);
      if (!res?.serial_id) throw new Error("Missing serial_id in response");
      auth.setSerial(res.serial_id);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl backdrop-blur">
        <Link to="/" className="mb-6 flex items-center gap-2 text-slate-300">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <span className="text-lg font-semibold tracking-tight">SnoreShift</span>
        </Link>

        <h1 className="font-sans text-2xl font-semibold tracking-tight text-white">
          {mode === "login" ? "Sign in" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {mode === "login"
            ? "Access your real-time monitoring dashboard."
            : "Register a new device account."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-slate-400">
              Username
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="border-slate-700 bg-slate-950 text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-widest text-slate-400">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="border-slate-700 bg-slate-950 text-slate-100"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-full bg-cyan-500 text-slate-950 hover:bg-cyan-400"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "login" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-4 w-full text-center text-xs text-slate-400 hover:text-cyan-400"
        >
          {mode === "login"
            ? "Don't have an account? Register"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
