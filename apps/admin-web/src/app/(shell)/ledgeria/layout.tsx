import { LedgeriaProductNav } from "@/components/shell/LedgeriaProductNav";

export default function LedgeriaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-0 px-4 py-4 lg:gap-8">
      <aside className="hidden w-52 shrink-0 lg:sticky lg:top-4 lg:block lg:self-start">
        <LedgeriaProductNav />
      </aside>
      <div className="min-w-0 flex-1">
        <div className="mb-4 lg:hidden">
          <LedgeriaProductNav />
        </div>
        {children}
      </div>
    </div>
  );
}
