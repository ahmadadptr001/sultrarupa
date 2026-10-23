import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { brotliCompress, constants, gzip } from "node:zlib";

const brotli = promisify(brotliCompress);
const gzipText = promisify(gzip);
// Bound the cache: the canonical URL can vary with the request host.
const encodedBodies = new Map<string, Promise<Uint8Array<ArrayBuffer>>>();

function responseEncoding(request: Request): "br" | "gzip" | undefined {
  const accepted = new Map((request.headers.get("accept-encoding") ?? "")
    .toLowerCase().split(",").map((entry) => {
      const [name, ...parameters] = entry.trim().split(";");
      const quality = parameters.find((value) => value.trim().startsWith("q="));
      return [name, quality === undefined ? 1 : Number(quality.trim().slice(2))];
    }));
  const quality = (name: string) => accepted.get(name) ?? accepted.get("*") ?? 0;
  const encoding = quality("br") >= quality("gzip") ? "br" : "gzip";
  if (quality(encoding) <= 0 || (accepted.get("identity") ?? 0) > quality(encoding)) return;
  return encoding;
}

function compressedBody(body: string, etag: string, encoding: "br" | "gzip") {
  const key = `${etag}:${encoding}`;
  let pending = encodedBodies.get(key);
  if (!pending) {
    pending = (encoding === "br"
      ? brotli(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } })
      : gzipText(body)).then(bytes => new Uint8Array(bytes));
    encodedBodies.set(key, pending);
    if (encodedBodies.size > 8) encodedBodies.delete(encodedBodies.keys().next().value!);
    pending.catch(() => encodedBodies.delete(key));
  }
  return pending;
}

const SITE_NAME = "Sultra Rupa";

export function siteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const url = new URL(configured || request.url);

  if (!/^https?:$/.test(url.protocol) || url.username || url.password) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute HTTP(S) site URL.");
  }

  return url.origin;
}

export function escapeMarkup(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function withSiteMetadata(source: string, origin: string): string {
  const canonical = `${origin}/`;
  const shareImage = `${origin}/share/sultrarupa-share.png`;
  let html = source;

  for (const [attribute, key, value] of [
    ["property", "og:url", canonical],
    ["property", "og:site_name", SITE_NAME],
    ["property", "og:image", shareImage],
    ["name", "twitter:url", canonical],
    ["name", "twitter:image", shareImage],
  ]) {
    const pattern = new RegExp(
      `<meta\\b(?=[^>]*\\b${attribute}=["']${key}["'])[^>]*>`,
      "i",
    );
    const tag = `<meta ${attribute}="${key}" content="${escapeMarkup(value)}" />`;
    html = pattern.test(html)
      ? html.replace(pattern, () => tag)
      : html.replace(/<\/head>/i, () => `    ${tag}\n  </head>`);
  }

  const canonicalTag = `<link rel="canonical" href="${escapeMarkup(canonical)}" />`;
  const canonicalPattern = /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i;
  html = canonicalPattern.test(html)
    ? html.replace(canonicalPattern, () => canonicalTag)
    : html.replace(/<\/head>/i, () => `    ${canonicalTag}\n  </head>`);
  html = html.replace(
    /<link\b(?=[^>]*\bhreflang=["']id-ID["'])[^>]*>/i,
    () => `<link rel="alternate" href="${escapeMarkup(canonical)}" hreflang="id-ID" />`,
  );

  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${canonical}#website`,
    name: SITE_NAME,
    alternateName: "Sultrarupa",
    url: canonical,
    inLanguage: "id-ID",
    description:
      "Jelajahi rumah adat, tari, musik, dan cerita masyarakat Sulawesi Tenggara dalam pengalaman 3D Sultra Rupa.",
  }).replace(/</g, "\\u003c");

  return html.replace(
    /<\/head>/i,
    () => `    <script type="application/ld+json">${schema}</script>\n  </head>`,
  );
}

export async function textResponse(
  request: Request,
  body: string,
  contentType: string,
): Promise<Response> {
  const etag = `W/"${createHash("sha256").update(body).digest("base64url")}"`;
  const headers: Record<string, string> = {
    "Content-Type": `${contentType}; charset=utf-8`,
    // The fallback canonical depends on this request's host. Never put it in a
    // shared cache; browsers can still revalidate without downloading the body.
    "Cache-Control": "private, max-age=0, must-revalidate",
    Vary: "Host, Accept-Encoding",
    ETag: etag,
  };
  const candidates = request.headers.get("if-none-match")?.split(",") ?? [];
  const unchanged = candidates.some((candidate) => {
    const value = candidate.trim().replace(/^W\//, "");
    return value === "*" || value === etag.replace(/^W\//, "");
  });

  if (unchanged) return new Response(null, { status: 304, headers });

  // Route Handler responses bypass compression in the current Next server.
  // Encode the complete HTML once instead of sending 200+ KB on every visit.
  const encoding = body.length >= 1024 ? responseEncoding(request) : undefined;
  if (encoding) {
    const bytes = await compressedBody(body, etag, encoding);
    headers["Content-Encoding"] = encoding;
    headers["Content-Length"] = String(bytes.byteLength);
    return new Response(bytes, { headers });
  }
  return new Response(body, { headers });
}
