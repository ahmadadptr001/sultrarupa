// Keep browser tabs, pinned shortcuts and app icons on the same vector artwork.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" role="img" aria-labelledby="title">
  <title id="title">Sultra Rupa — rumah panggung dan laut</title>
  <rect width="64" height="64" rx="17" fill="#103F49"/>
  <path d="M12 30 32 12 52 30" stroke="#F1C879" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M19 32v10h26V32M22 42v6m20-6v6" stroke="#FFF4DA" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M30 42v-8h4v8" fill="#FFF4DA"/>
  <path d="M13 52c6-4 13-4 19 0s13 4 19 0" stroke="#59C8BD" stroke-width="4" stroke-linecap="round"/>
</svg>
`;
(async () => {
  const icons = path.join(root, 'public/icons');
  for (const theme of ['light', 'dark']) {
    await fs.writeFile(path.join(icons, `favicon_${theme}.svg`), svg);
  }
  for (const size of [180, 192, 512]) {
    await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(icons, `icon_${size}.png`));
  }
  const sizes = [16, 32, 48, 64];
  const images = await Promise.all(sizes.map(size => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()));
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  images.forEach((image, index) => {
    const at = 6 + index * 16;
    header[at] = header[at + 1] = sizes[index];
    header.writeUInt16LE(1, at + 4);
    header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(image.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += image.length;
  });
  await fs.writeFile(path.join(root, 'app/favicon.ico'), Buffer.concat([header, ...images]));
  console.log('Updated SVG, ICO and 180/192/512px app icons.');
})().catch(error => { console.error(error); process.exitCode = 1; });
