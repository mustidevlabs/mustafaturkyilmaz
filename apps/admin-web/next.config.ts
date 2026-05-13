import type { NextConfig } from "next";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

const strapiUrl =
  process.env.NEXT_PUBLIC_STRAPI_URL ??
  "https://timely-spirit-9e046731e1.strapiapp.com";
const { hostname, protocol, port } = new URL(strapiUrl);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
        port: port || undefined,
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
