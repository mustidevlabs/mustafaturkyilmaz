const DEFAULT_LINKS = [
  { label: "Mail", href: "https://mail.google.com/" },
  { label: "Calendar", href: "https://calendar.google.com/" },
  { label: "Meet", href: "https://meet.google.com/" },
] as const;

export function ExternalLinks() {
  return (
    <div className="flex flex-wrap items-center gap-1 border-l border-zinc-200 pl-2 dark:border-zinc-700">
      {DEFAULT_LINKS.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          className="rounded-md px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
