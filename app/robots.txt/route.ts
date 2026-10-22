import { siteOrigin, textResponse } from "@/lib/site-seo";

export function GET(request: Request) {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin(request)}/sitemap.xml\n`;
  return textResponse(request, body, "text/plain");
}
