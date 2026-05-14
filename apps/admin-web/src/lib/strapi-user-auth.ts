import { getStrapiPublicUrl } from "@/lib/strapi-public-url";

export async function verifyStrapiUserJwt(jwt: string): Promise<boolean> {
  const base = getStrapiPublicUrl().replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/api/users/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}
