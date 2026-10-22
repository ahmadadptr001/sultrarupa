import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/coastal_world.html", destination: "/", permanent: true }];
  },
  async headers() {
    return [
      {
        // These originals are content-addressed and are never rewritten.
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      ...[
        "Gilmer-Medium.dfe209dd65453426.woff2",
        "Gilmer-Bold.b4e74cd165453426.woff2",
        "Comfortaa-Regular.d3d2e80c65453426.woff2",
        "RobotoMono-Bold.bbd256c265453426.woff2",
      ].map((font) => ({
        source: `/assets/${font}`,
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      })),
      {
        source: "/:path(intro|customize|mini-game|phone|quests)",
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      },
    ];
  },
  async rewrites() {
    return {
      afterFiles: [
        ...["intro", "customize", "mini-game", "phone", "quests"].map((route) => ({
          source: `/${route}`,
          destination: "/",
        })),
      ],
    };
  },
};

export default nextConfig;
