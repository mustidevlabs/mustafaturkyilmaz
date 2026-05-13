import Link from "next/link";
import { fetchStrapi, strapiMedia } from "@/lib/strapi";
import type { Project, StrapiResponse } from "@/types/strapi";

export const metadata = {
  title: "Projeler — Portfolio",
};

async function getAllProjects() {
  try {
    const res = await fetchStrapi<StrapiResponse<Project[]>>("projects", {
      populate: "*",
      "sort[0]": "order:asc",
      "sort[1]": "createdAt:desc",
      "pagination[pageSize]": 100,
    });
    return res.data ?? [];
  } catch {
    return [];
  }
}

export default async function ProjectsPage() {
  const projects = await getAllProjects();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Tum Projeler</h1>
        <Link
          href="/"
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Ana sayfa
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          Henuz proje yok. Strapi admin panelinde proje ekledikten sonra burada
          gozukecek.
        </p>
      ) : (
        <ul className="flex flex-col gap-6">
          {projects.map((p) => {
            const cover = strapiMedia(p.cover?.url);
            return (
              <li
                key={p.id}
                className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 sm:flex-row dark:border-zinc-800 dark:bg-zinc-950"
              >
                {cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt={p.cover?.alternativeText ?? p.title}
                    className="h-32 w-full rounded-lg object-cover sm:h-32 sm:w-48"
                  />
                )}
                <div className="flex flex-1 flex-col gap-2">
                  <h2 className="text-xl font-semibold">{p.title}</h2>
                  {p.summary && (
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {p.summary}
                    </p>
                  )}
                  {Array.isArray(p.technologies) &&
                    p.technologies.length > 0 && (
                      <ul className="flex flex-wrap gap-1">
                        {p.technologies.map((t) => (
                          <li
                            key={t}
                            className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            {t}
                          </li>
                        ))}
                      </ul>
                    )}
                  <div className="mt-auto flex gap-3 pt-2 text-sm">
                    {p.liveUrl && (
                      <a
                        href={p.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Live →
                      </a>
                    )}
                    {p.repoUrl && (
                      <a
                        href={p.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-600 hover:underline dark:text-zinc-400"
                      >
                        Repo →
                      </a>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
