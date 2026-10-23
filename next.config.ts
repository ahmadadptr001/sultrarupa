import type { NextConfig } from "next";
import assetVersions from "./config/asset-versions.json";

const nextConfig: NextConfig = {
  // Allow production audits while a developer keeps `next dev` running.
  distDir: process.env.SULTRA_BUILD_DIR || ".next",
  async redirects() {
    return [{ source: "/coastal_world.html", destination: "/", permanent: true }];
  },
  async headers() {
    return [
      {
        // Reuse native binary assets even when two scene loaders ask for them.
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=300, stale-while-revalidate=86400" }],
      },
      ...["js", "css"].map((extension) => ({
        // Historical build IDs are edited in place: always revalidate code.
        source: `/assets/:file(.*\\.${extension})`,
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      })),
      ...Object.entries(assetVersions).map(([asset, version]) => ({
        source: `/asset-cache/${version}${asset}`,
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      })),
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
        // The decoder serves every draco-compressed model and ships with the
        // deployment, so repeat visits should never re-download it.
        source: "/vendors/draco/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Static recordings and the island music ship outside the versioned
      // model pipeline; a bounded fresh window keeps repeat visits cheap while
      // still picking up re-recorded audio within a day.
      ...["/audio/:path*", "/models/:path*"].map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
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
        ...Object.entries(assetVersions).map(([asset, version]) => ({
          source: `/asset-cache/${version}${asset}`,
          destination: asset,
        })),
        ...["intro", "customize", "mini-game", "phone", "quests"].map((route) => ({
          source: `/${route}`,
          destination: "/",
        })),
      ],
    };
  },
};

export default nextConfig;
