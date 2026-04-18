import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, getBaseUrl, setBaseUrl, setSerialId, setUsername } from "@/lib/api";
import SiteHeader from "@/components/SiteHeader";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — SnoreShift" },
      { name: "description", content: "Sign in or create an account to monitor your sleep with Guardian's Pillow." },
    ],
  }),
});

type Mode = "login" | "register";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUserField] = useState("");
  const [password, setPassword] = useState("");
  const [backend, setBackend] = useState(getBaseUrl());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      setBaseUrl(backend.trim() || "http://localhost:5000");
      if (mode === "login") {
        const res = await api.login(username, password);
        if (!res.serial_id) throw new Error("No serial_id returned");
        setSerialId(res.serial_id);
        setUsername(username);
        navigate({ to: "/dashboard" });
      } else {
        const res = await api.register(username, password);
        if (res.serial_id) {
          setSerialId(res.serial_id);
          setUsername(username);
          navigate({ to: "/dashboard" });
        } else {
          setMode("login");
          setError("Account created. Please sign in.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-hero-gradient">
      <SiteHeader />

      <section className="mx-auto flex max-w-md flex-col items-center px-6 pb-20 pt-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-foreground/20 bg-background/60 backdrop-blur">
          <Activity className="h-5 w-5" />
        </div>
        <h1 className="text-center text-4xl text-foreground md:text-5xl">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          {mode === "login"
            ? "Sign in to view your live sleep monitor and history."
            : "Register a Guardian's Pillow account to start monitoring."}
        </p>

        <div className="mt-8 w-full rounded-3xl border border-border bg-card/80 p-6 shadow-soft backdrop-blur">
          <div className="mb-5 flex rounded-full border border-border bg-background/70 p-1">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                  mode === m
                    ? "bg-foreground text-background shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Username
              </label>
              <Input
                value={username}
                onChange={(e) => setUserField(e.target.value)}
                required
                autoComplete="username"
                className="h-11 rounded-full bg-background/70 px-4"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="h-11 rounded-full bg-background/70 px-4"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Backend URL
              </label>
              <Input
                value={backend}
                onChange={(e) => setBackend(e.target.value)}
                placeholder="http://localhost:5000"
                className="h-11 rounded-full bg-background/70 px-4 font-mono text-xs"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-12 rounded-full text-sm font-semibold"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
