import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warn" | "danger";

const tones: Record<Tone, string> = {
  info: "border-border bg-muted/60 text-foreground",
  success: "border-primary/30 bg-primary/10 text-foreground",
  warn: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
  danger:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100",
};

export function Alert({
  tone = "info",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  return (
    <div
      role="status"
      className={cn("rounded-lg border px-3 py-2 text-sm", tones[tone], className)}
      {...props}
    />
  );
}
