/** Strapi Cloud default; override with `NEXT_PUBLIC_STRAPI_URL` in `.env.local`. */
export const DEFAULT_STRAPI_PUBLIC_URL =
  "https://timely-spirit-9e046731e1.strapiapp.com" as const;

export function getStrapiPublicUrl(): string {
  return (
    process.env.NEXT_PUBLIC_STRAPI_URL?.trim() || DEFAULT_STRAPI_PUBLIC_URL
  );
}
