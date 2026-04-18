import { cn } from "@/lib/utils";

type Props = { status?: string; className?: string };

const palette: Record<string, string> = {
  APNEA: "bg-red-500/15 text-red-400 ring-red-500/40",
  SENSING: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/40",
  INFLATING: "bg-orange-500/15 text-orange-400 ring-orange-500/40",
  IDLE: "bg-slate-500/15 text-slate-300 ring-slate-500/40",
  SNORING: "bg-amber-500/15 text-amber-400 ring-amber-500/40",
};

export default function StatusBadge({ status, className }: Props) {
  const key = (status ?? "IDLE").toUpperCase();
  const tone = palette[key] ?? palette.IDLE;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ring-1",
        tone,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {key}
    </span>
  );
}
