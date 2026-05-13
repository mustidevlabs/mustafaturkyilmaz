import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const portfolioUrl =
  process.env.NEXT_PUBLIC_PORTFOLIO_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Admin",
  description: "Internal operations: Ledgeria issues, portfolio CMS, and more.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white dark:bg-zinc-100 dark:text-zinc-900">
                Admin
              </span>
              <nav className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-md bg-emerald-100 px-2 py-1 font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                  Ledgeria issues
                </span>
                <span className="text-zinc-400 dark:text-zinc-500">
                  Portfolio CMS (soon)
                </span>
              </nav>
            </div>
            <Link
              href={portfolioUrl}
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              target="_blank"
              rel="noreferrer"
            >
              Public portfolio →
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
