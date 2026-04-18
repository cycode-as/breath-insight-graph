import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { clearSession, getUsername } from "@/lib/api";

export default function SiteHeader() {
  const { location } = useRouterState();
  const [username, setUsernameState] = useState<string | null>(null);

  useEffect(() => {
    setUsernameState(getUsername());
  }, [location.pathname]);

  const handleLogout = () => {
    clearSession();
    setUsernameState(null);
    window.location.href = "/";
  };

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-background/60 hover:text-foreground"
      activeProps={{ className: "bg-background/80 text-foreground shadow-soft" }}
    >
      {label}
    </Link>
  );

  return (
    <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-6">
      <Link to="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/20 bg-background/60 backdrop-blur">
          <Activity className="h-4 w-4" />
        </div>
        <span className="text-xl font-semibold tracking-tight">SnoreShift</span>
      </Link>

      <nav className="flex items-center gap-1 rounded-full border border-border bg-background/60 p-1 backdrop-blur">
        {navLink("/", "Home")}
        {navLink("/dashboard", "Dashboard")}
        {navLink("/logs", "Logs")}
      </nav>

      {username ? (
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs text-muted-foreground sm:inline">
            {username}
          </span>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="h-10 rounded-full border-foreground/20 bg-background/70 px-4 backdrop-blur"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      ) : (
        <Button asChild className="h-10 rounded-full px-5">
          <Link to="/auth">Sign In / Sign Up</Link>
        </Button>
      )}
    </header>
  );
}
