import { ShellHeader } from "@/components/shell/ShellHeader";

export default function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full flex-col">
      <ShellHeader />
      <div className="flex min-h-0 flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
        {children}
      </div>
    </div>
  );
}
