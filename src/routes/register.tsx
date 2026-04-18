import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity, Eye, EyeOff, CheckCircle2, Cpu, User, Lock, ArrowRight,
  Moon, Mic, Waves, Wind, ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({
    meta: [{ title: "Sign Up — SnoreShift" }],
  }),
});

const BASE_URL = "http://localhost:5000";

function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; serialId?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, device_id: deviceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? data?.error ?? "Registration failed.");
        return;
      }
      if (data?.serial_id) {
        localStorage.setItem("serial_id", data.serial_id);
        setSuccess({ message: "Account created successfully!", serialId: data.serial_id });
        setTimeout(() => navigate({ to: "/" }), 3500);
      } else {
        setSuccess({ message: "Account created! Please sign in." });
        setTimeout(() => navigate({ to: "/login" }), 1800);
      }
    } catch {
      setError("Could not reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-hero-gradient">

      {/* ── Top nav ── */}
      <header className="flex items-center justify-between px-8 py-5">
        {/* Left: logo + wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/20 bg-background/70 shadow-soft backdrop-blur">
            <Activity className="h-5 w-5 text-foreground" />
          </div>
          <span className="text-2xl font-semibold tracking-tight text-foreground">SnoreShift</span>
        </div>

        {/* Right: Sign in + Sign up */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="h-9 rounded-full px-5 text-sm font-medium"
            onClick={() => navigate({ to: "/login" })}
          >
            Sign in
          </Button>
          <Button
            className="h-9 rounded-full bg-foreground px-5 text-sm font-medium text-background hover:bg-foreground/90"
            onClick={() => navigate({ to: "/register" })}
          >
            Sign up
          </Button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1">
        <BrandingPanel />

        {/* ── Right: form panel ── */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl text-foreground">Create account</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Register your Guardian's Pillow device to get started.
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-soft backdrop-blur">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="choose_a_username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoComplete="username"
                      className="h-11 rounded-xl pl-10"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="h-11 rounded-xl pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Device ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Device ID
                  </label>
                  <div className="relative">
                    <Cpu className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="e.g. GP-XXXX-XXXX"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                      required
                      autoComplete="off"
                      className="h-11 rounded-xl pl-10 font-mono text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Found on the label on the bottom of your Guardian's Pillow device.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                    {error}
                  </div>
                )}

                {/* Success */}
                {success && (
                  <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-success">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {success.message}
                    </div>
                    {success.serialId && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
                        <span className="text-[11px] text-muted-foreground">Serial ID:</span>
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {success.serialId}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !!success}
                  className="mt-1 h-11 w-full rounded-full bg-foreground text-background hover:bg-foreground/90"
                >
                  {loading ? "Creating account…" : <><span>Create account</span><ArrowRight className="ml-1.5 h-4 w-4" /></>}
                </Button>
              </form>

              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Shared branding panel ──────────────────────────────────────────────────

function BrandingPanel() {
  return (
    <div className="relative hidden flex-col items-center justify-center overflow-hidden lg:flex lg:w-[45%]">
      <div className="absolute inset-0 -z-10 bg-accent/20" />
      <div className="absolute left-1/2 top-1/2 -z-10 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signature/10 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 -z-10 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-2xl" />

      <div className="flex h-full w-full flex-col items-center justify-center px-12 py-10 text-center">
        <p className="max-w-[230px] text-sm leading-relaxed text-muted-foreground">
          AI-powered sleep apnea detection through real-time audio analysis.
        </p>

        <OrbitDiagram />

        {/* ── Feature grid 2×2 ── */}
        <div className="grid w-full max-w-[300px] grid-cols-2 gap-2.5">
          {[
            { icon: <Mic className="h-4 w-4" />,         label: "Real-time audio capture",       color: "text-signature" },
            { icon: <Waves className="h-4 w-4" />,       label: "FFT snore detection 100–300 Hz", color: "text-success" },
            { icon: <Wind className="h-4 w-4" />,        label: "Auto pillow inflation",          color: "text-blue-500" },
            { icon: <ShieldCheck className="h-4 w-4" />, label: "Apnea alert & session logs",     color: "text-signature" },
          ].map((f) => (
            <div
              key={f.label}
              className="flex flex-row items-center gap-2.5 rounded-2xl border border-border bg-background/50 px-3.5 py-3 backdrop-blur"
            >
              <span className={`shrink-0 ${f.color}`}>{f.icon}</span>
              <span className="text-left text-[11px] font-medium leading-snug text-foreground/80">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrbitDiagram() {
  const icons = [
    { icon: <Mic className="h-4 w-4" />,        color: "text-signature", bg: "bg-signature/15 border-signature/30", delay: "0s" },
    { icon: <Waves className="h-4 w-4" />,       color: "text-success",   bg: "bg-success/15 border-success/30",     delay: "0.4s" },
    { icon: <Wind className="h-4 w-4" />,        color: "text-blue-500",  bg: "bg-blue-500/15 border-blue-500/30",   delay: "0.8s" },
    { icon: <Moon className="h-4 w-4" />,        color: "text-signature", bg: "bg-signature/15 border-signature/30", delay: "1.2s" },
    { icon: <ShieldCheck className="h-4 w-4" />, color: "text-success",   bg: "bg-success/15 border-success/30",     delay: "1.6s" },
  ];

  return (
    <div className="relative my-8 flex h-64 w-64 items-center justify-center">
      <div className="absolute inset-10 rounded-full bg-signature/5" />

      {/* spinning ring — icons are children so they orbit with it */}
      <div className="spin-slow absolute inset-0 rounded-full border border-dashed border-signature/25">
        {icons.map((item, i) => {
          const angle = (i / icons.length) * 360 - 90;
          const rad = angle * (Math.PI / 180);
          const r = 50;
          const x = 50 + r * Math.cos(rad);
          const y = 50 + r * Math.sin(rad);
          return (
            <div
              key={i}
              className={`absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-soft backdrop-blur ${item.bg} ${item.color}`}
              style={{ left: `${x}%`, top: `${y}%`, animation: `orbit-icon-counter 18s linear infinite` }}
            >
              <span style={{ display: "inline-flex", animation: `pulse-dot 2.5s ease-in-out infinite`, animationDelay: item.delay }}>
                {item.icon}
              </span>
            </div>
          );
        })}
      </div>

      <div className="spin-slow-reverse absolute inset-6 rounded-full border border-dotted border-success/20" />
      <div className="absolute inset-12 rounded-full border border-signature/10" />

      <div className="breathe relative z-10 flex h-20 w-20 items-center justify-center rounded-full border border-signature/40 bg-background/90 shadow-glow backdrop-blur">
        <Activity className="h-9 w-9 text-foreground" />
      </div>
    </div>
  );
}
