import { PortfolioProductNav } from "@/components/shell/PortfolioProductNav";

export default function PortfolioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 lg:flex-row lg:gap-8">
      <aside className="shrink-0 lg:w-44">
        <PortfolioProductNav />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
