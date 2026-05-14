import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio — Admin",
};

export default function PortfolioAdminPage() {
  return (
    <div className="py-4">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Portfolio CMS
      </h1>
      <p className="mt-3 max-w-lg text-sm text-zinc-600 dark:text-zinc-400">
        This area will host Strapi (or other) controls for the public portfolio site.
        Nothing is wired here yet; use the hub to jump back to Ledgeria when needed.
      </p>
    </div>
  );
}
