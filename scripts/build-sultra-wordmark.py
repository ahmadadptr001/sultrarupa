"""Build the shared vector/3D Sultra Rupa title. Run with uv --with svgpathtools --with mapbox-earcut --with numpy --with shapely."""
import json
from pathlib import Path
import numpy as np
import mapbox_earcut
from shapely.geometry import Polygon
from svgpathtools import parse_path

ROOT = Path(__file__).resolve().parents[1]
# Deliberately drawn outlines: geometric upper line and tall, slightly uneven
# comic lettering below, matching the two-level construction of the game logo.
TOP = {
    'S': 'M48 6L39 19Q31 13 22 13Q17 13 17 16Q17 18 27 20Q50 24 50 37Q50 55 25 55Q9 55 0 46L10 34Q19 41 29 41Q34 41 34 38Q34 36 23 34Q1 30 1 17Q1 0 24 0Q39 0 48 6Z',
    'U': 'M0 1H18V31Q18 40 26 40Q34 40 34 31V1H52V31Q52 55 26 55Q0 55 0 31Z',
    'L': 'M0 1H18V39H44V54H0Z',
    'T': 'M0 1H50V16H34V54H16V16H0Z',
    'R': 'M0 1H28Q51 1 51 20Q51 32 39 37L54 54H33L21 39H18V54H0Z M18 14V27H26Q34 27 34 20Q34 14 26 14Z',
    'A': 'M21 1H40L62 54H42L39 46H21L18 54H0Z M26 33H34L30 21Z',
}
BOTTOM = {
    'R': 'M3 3Q19 0 40 2C59 2 70 11 70 29C71 42 66 51 56 56Q68 74 76 98Q66 102 50 98L36 66Q34 62 27 63L29 99Q17 101 4 98Q1 83 3 67L1 37Z M26 19L27 45Q36 46 44 42Q49 33 45 21Q39 18 26 19Z',
    'U': 'M1 4Q13 1 27 3L25 67Q25 80 38 80Q52 80 51 65L50 2Q63 0 77 3L76 65Q79 98 40 100Q0 102 2 68L3 39Z',
    'P': 'M3 3Q19 0 40 2Q74 1 75 33Q75 61 48 64L28 64L29 98Q15 101 2 98L3 73L1 40Z M27 20L28 44Q39 45 46 40Q51 34 47 24Q44 18 27 20Z',
    'A': 'M26 3Q39 0 52 3Q63 27 69 52L81 98Q66 101 53 98L49 81L29 82L25 99Q12 101 0 98L13 53Z M35 62L46 61L40 34Z',
}

def outlines(glyphs, word, y, height, width=348):
    paths = [parse_path(glyphs[letter]) for letter in word]
    natural = sum(p.bbox()[1] - p.bbox()[0] for p in paths) + 6 * (len(paths)-1)
    x = 2
    placed = []
    for path in paths:
        left, right, top, bottom = path.bbox()
        sx, sy = width / natural, height / (bottom-top)
        path = path.translated(complex(-left, -top)).scaled(sx, sy).translated(complex(x, y))
        placed.append(path)
        x += (right-left+6) * sx
    return placed

top = outlines(TOP, 'SULTRA', 1, 54)
bottom = outlines(BOTTOM, 'RUPA', 65, 104)
branding = ROOT / 'public/branding'
branding.mkdir(exist_ok=True)
svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 170" role="img" aria-label="Sultra Rupa">\n<g id="wordmark">\n'
for name, paths in [('coastal', top), ('world', bottom)]:
    svg += f'<path class="{name}" fill="currentColor" fill-rule="evenodd" d="' + ' '.join(p.d() for p in paths) + '"/>\n'
svg += '</g>\n</svg>\n'
(branding / 'sultra-rupa.svg').write_text(svg, encoding='utf8')

vertices, indices = [], []
for path in top + bottom:
    rings = []
    for subpath in path.continuous_subpaths():
        coords = []
        for segment in subpath:
            steps = max(1, int(segment.length()/1.2))
            coords.extend([(p.real, p.imag) for p in (segment.point(t) for t in np.linspace(0,1,steps,endpoint=False))])
        rings.append(coords)
    rings.sort(key=lambda r: Polygon(r).area, reverse=True)
    polygon = Polygon(rings[0], rings[1:])
    if not polygon.is_valid:
        raise ValueError('Invalid lettering polygon')
    flat = np.array([p for ring in rings for p in ring], dtype=np.float64)
    triangles = mapbox_earcut.triangulate_float64(flat, np.cumsum([len(r) for r in rings], dtype=np.uint32))
    offset = len(vertices)//3
    count = len(flat)
    # Match the coordinate frame and bounds used by the original intro mesh.
    for z in [0, -.141]:
        for x,y in flat:
            # The native intro camera sees the -Z side, so lettering runs from
            # +X to -X in this local frame (the SVG remains left-to-right).
            vertices.extend([round(1.213 - x/352*2.473,6), round(-.006 + (170-y)/170*1.427,6), z])
    for i in range(0,len(triangles),3):
        a,b,c = map(int,triangles[i:i+3])
        indices.extend([offset+c,offset+b,offset+a, offset+count+a,offset+count+b,offset+count+c])
    start = 0
    for ring in rings:
        for j in range(len(ring)):
            a,b = offset+start+j,offset+start+(j+1)%len(ring)
            indices.extend([a,b,b+count,a,b+count,a+count])
        start += len(ring)
target = ROOT / 'public/models/sultra-rupa-wordmark.json'
# Mirroring X also reverses triangle handedness; retain outward-facing caps.
indices = [index for i in range(0, len(indices), 3) for index in (indices[i], indices[i+2], indices[i+1])]
target.write_text(json.dumps({'positions': vertices, 'indices': indices}, separators=(',',':')), encoding='utf8')
print(f'Built vector + {len(vertices)//3} vertices / {len(indices)//3} triangles')
