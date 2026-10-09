import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      afterFiles: [
        {
          source:
            "/((?!assets|_next|favicon.ico|coastal_world.html|icons|manifest.webmanifest|share).*)",
          destination: "/",
        },
      ],
    };
  },
};

export default nextConfig;
