import { cn } from "@/lib/utils";

export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table
        className={cn("w-full min-w-[40rem] text-left text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function THead(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className="border-b border-border bg-muted/70 text-xs font-medium uppercase tracking-wide text-muted-foreground"
      {...props}
    />
  );
}

export function Th({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("whitespace-nowrap px-3 py-2.5 font-medium", className)}
      {...props}
    />
  );
}

export function Td({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-3 py-2.5 align-middle", className)} {...props} />
  );
}

export function Tr({
  className,
  href: _href,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { href?: string }) {
  return (
    <tr
      className={cn(
        "border-b border-border last:border-0",
        props.onClick && "cursor-pointer hover:bg-muted/60",
        className
      )}
      {...props}
    />
  );
}
