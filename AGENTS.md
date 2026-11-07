<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project theme

Canonical theme name: **Pesisir Toska** (Coastal Teal Heritage).

Design style: **Playful Heritage** — a hybrid of **casual/arcade game UI** (soft-pop, rounded, saturated) and **heritage editorial** (warm paper, serif headings, ochre accents). The 3D world is **stylized low-poly**. It is not brutalism, cyberpunk, or flat corporate SaaS.

Use this name when describing or extending the UI. The theme lives in the standalone game, not in `app/globals.css` (that file only serves the minimal Next.js metadata shell). Source of truth: `public/coastal_world.html` and `public/assets/sultra-{shell,culture,interior}.css`.

- **Shell / arcade layer**: purple ink `#3b3777`, teal `#02c6a7`, coral `#f2676f`, yellow `#f6d35f`; Gilmer for UI, Comfortaa for display, rounded cards and soft shadows.
- **Culture / heritage layer**: warm paper `#fbf7ee`, deep green ink `#153e38`, ochre `#b9914b`; Georgia serif headings, Inter body, editorial panels.
- **Interior / gallery layer**: shell palette on white/paper surfaces.

Preserve this layered coastal-heritage identity when adding UI. Do not replace it with default Tailwind/Geist styling or the legacy Coastal World/MUNAS brand.
