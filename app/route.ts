import { readFile } from "node:fs/promises";
import path from "node:path";
import { siteOrigin, textResponse, withSiteMetadata } from "@/lib/site-seo";

let productionHtml: Promise<string> | undefined;

function readHtml(): Promise<string> {
  // The game requests HD models as soon as its loader is ready. Preloading all
  // seven here occupied mobile connections before fonts and engine imports.
  const load = () => readFile(path.join(process.cwd(), "public", "coastal_world.html"), "utf-8");

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
