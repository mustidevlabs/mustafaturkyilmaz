import { PortfolioProductNav } from "@/components/shell/PortfolioProductNav";

export default function PortfolioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-0 px-4 py-4 lg:gap-8">
      <aside className="hidden w-52 shrink-0 lg:sticky lg:top-4 lg:block lg:self-start">
        <PortfolioProductNav />
      </aside>
      <div className="min-w-0 flex-1">
        <div className="mb-4 lg:hidden">
          <PortfolioProductNav />
        </div>
        {children}
      </div>
    </div>
  );
}
