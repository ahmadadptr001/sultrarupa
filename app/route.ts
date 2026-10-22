import { readFile } from "node:fs/promises";
import path from "node:path";
import { siteOrigin, textResponse, withSiteMetadata } from "@/lib/site-seo";
import assetVersions from "@/config/asset-versions.json";

// These models are visible on both the introduction and returning-player scene.
// Discover them in the HTML instead of waiting for the game module to initialize.
const startupPreloads = [
  "/models/culture/laika.glb",
  "/models/culture/bharugano-wuna.glb",
  "/models/culture/banua-tada.glb",
  "/models/culture/mekongga.glb",
  "/models/culture/tugu-mtq.glb",
  "/models/culture/patung-oputa.glb",
  "/models/player-anoa.glb",
] as const;
const preloadLinks = startupPreloads.map(asset =>
  `<link rel="preload" as="fetch" crossorigin href="/asset-cache/${assetVersions[asset]}${asset}">`
).join("\n");

let productionHtml: Promise<string> | undefined;

function readHtml(): Promise<string> {
  const load = async () => {
    const html = await readFile(path.join(process.cwd(), "public", "coastal_world.html"), "utf-8");
    return html.replace("</head>", `${preloadLinks}\n</head>`);
  };

  // Production assets are immutable for the lifetime of a deployment. Keep
  // development reads fresh so edits to the standalone game HTML appear at once.
  if (process.env.NODE_ENV !== "production") return load();

  productionHtml ??= load().catch((error: unknown) => {
    productionHtml = undefined;
    throw error;
  });
  return productionHtml;
}

export async function GET(request: Request) {
  const html = withSiteMetadata(await readHtml(), siteOrigin(request));
  return textResponse(request, html, "text/html");
}
