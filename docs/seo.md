# SEO and site URL

The home page is returned by `app/route.ts` from `public/coastal_world.html`.
Next.js layout metadata does not wrap this HTML response. The route adds absolute
canonical and social-sharing URLs, plus `WebSite` structured data, to that HTML.
`/robots.txt` points to `/sitemap.xml`; the sitemap contains only the real home page.

Set `NEXT_PUBLIC_SITE_URL` to the actual production origin when deploying, for
example `https://your-actual-domain.tld` (replace this example). Use an absolute
HTTP(S) URL without credentials. Set it before building and restart/redeploy after
changing it. If omitted, URLs follow the incoming request origin, so local
development and preview deployments do not claim an invented production domain.

The source HTML is read once per server process in production, and reread during
development. Deploy/restart the production server when changing that file.
Responses use private revalidation and an ETag: matching requests return `304`,
while metadata from one request host is never reused in a shared HTTP cache.

Search references:

- [Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Site names and WebSite structured data](https://developers.google.com/search/docs/appearance/site-names)
- [Sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
