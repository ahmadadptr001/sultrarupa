import { escapeMarkup, siteOrigin, textResponse } from "@/lib/site-seo";

export function GET(request: Request) {
  const canonical = escapeMarkup(`${siteOrigin(request)}/`);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${canonical}</loc></url>
</urlset>
`;
  return textResponse(request, body, "application/xml");
}
