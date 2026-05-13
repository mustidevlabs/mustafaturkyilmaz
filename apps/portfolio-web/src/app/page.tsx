import Link from "next/link";
import { fetchStrapi, strapiMedia, STRAPI_PUBLIC_URL } from "@/lib/strapi";
import type { About, Project, Skill, StrapiResponse } from "@/types/strapi";

async function getAbout() {
  try {
    const res = await fetchStrapi<StrapiResponse<About | null>>("about", {
      populate: "*",
    });
    return res.data;
  } catch {
    return null;
  }
}

async function getProjects() {
  try {
    const res = await fetchStrapi<StrapiResponse<Project[]>>("projects", {
      populate: "*",
      "sort[0]": "order:asc",
      "sort[1]": "createdAt:desc",
      "pagination[pageSize]": 6,
    });
    return res.data ?? [];
  } catch {
    return [];
  }
}

async function getSkills() {
  try {
    const res = await fetchStrapi<StrapiResponse<Skill[]>>("skills", {
      "sort[0]": "category:asc",
      "sort[1]": "order:asc",
    });
    return res.data ?? [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [about, projects, skills] = await Promise.all([
    getAbout(),
    getProjects(),
    getSkills(),
  ]);

  const strapiUp = about !== null || projects.length > 0 || skills.length > 0;
  const strapiAdminUrl = `${STRAPI_PUBLIC_URL.replace(/\/$/, "")}/admin`;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-16 px-6 py-16">
      <section className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {about?.fullName ?? "Mustafa Turkyilmaz"}
        </h1>
        {about?.headline && (
          <p className="text-xl text-zinc-600 dark:text-zinc-300">
            {about.headline}
          </p>
        )}
        {about?.bio && (
          <p className="max-w-2xl whitespace-pre-line text-zinc-600 dark:text-zinc-400">
            {about.bio}
          </p>
        )}
        {!strapiUp && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
            <p className="font-medium">Could not load content from Strapi.</p>
            <p className="mt-1">
              Open{" "}
              <a
                href={strapiAdminUrl}
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                Strapi admin
              </a>{" "}
              to add content and check Public role permissions. For a different
              Strapi host, set{" "}
              <code className="rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-900">
                NEXT_PUBLIC_STRAPI_URL
              </code>
              .
            </p>
          </div>
        )}
      </section>

      {projects.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
            <Link
              href="/projects"
              className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const cover = strapiMedia(p.cover?.url);
              return (
                <article
                  key={p.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
                >
                  {cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={p.cover?.alternativeText ?? p.title}
                      className="h-44 w-full object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="font-semibold">{p.title}</h3>
                    {p.summary && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {p.summary}
                      </p>
                    )}
                    {Array.isArray(p.technologies) &&
                      p.technologies.length > 0 && (
                        <ul className="mt-auto flex flex-wrap gap-1 pt-2">
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
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {skills.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">Skills</h2>
          <ul className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <li
                key={s.id}
                className="rounded-full border border-zinc-200 px-3 py-1 text-sm dark:border-zinc-800"
              >
                <span className="font-medium">{s.name}</span>
                <span className="ml-2 text-xs text-zinc-500">
                  {s.category}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
