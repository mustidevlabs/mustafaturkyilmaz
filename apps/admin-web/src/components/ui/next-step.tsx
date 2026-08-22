import Link from "next/link";

export function NextStep({
  children,
  href,
  label,
}: {
  children: React.ReactNode;
  href: string;
  label: string;
}) {
  return (
    <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{children}</span>
      <Link href={href} className="font-medium text-primary hover:underline">
        {label} →
      </Link>
    </p>
  );
}
