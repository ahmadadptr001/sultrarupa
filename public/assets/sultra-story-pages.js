/**
 * Shared by the story balloons and prerecorded narration generator.
 * Keep segmentation independent of browser locale so the page/audio pairs agree.
 */
export function getStoryPages(target) {
  const description = Array.isArray(target?.description)
    ? target.description.join(' ')
    : String(target?.description || '');
  const text = description.replace(/\s+/gu, ' ').trim();
  if (!text) return [];

  const maxLength = 300;
  const sentences = text.split(/(?<=[.!?])\s+(?=\S)/u);
  const parts = [];
  for (const sentence of sentences) {
    let rest = sentence;
    while (rest.length > maxLength) {
      const candidate = rest.slice(0, maxLength + 1);
      // Prefer a natural pause; split only at word boundaries otherwise.
      const clause = [...candidate.matchAll(/[,;:]\s/gu)].at(-1);
      let cut = clause && clause.index >= 160 ? clause.index + 1 : candidate.lastIndexOf(' ');
      if (cut <= 0) cut = rest.indexOf(' ');
      if (cut <= 0) break;
      parts.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) parts.push(rest);
  }

  const pages = [];
  let page = '';
  for (const part of parts) {
    if (page && page.length + part.length + 1 > maxLength) {
      pages.push(page);
      page = '';
    }
    page += `${page ? ' ' : ''}${part}`;
  }
  if (page) pages.push(page);
  return pages;
}
