# Lulo crowd and movement

The scene uses a simplified Lulo Leba pattern: two small steps right, four left,
with low joined hands. The planted foot remains at its last step while the other
foot lifts and catches up; a small weight shift and hand pulse accompany the beat.
This is a procedural interpretation, not motion capture or a representation of
every regional Lulo variant.

Reference: Sihartin, *Pola Pelatihan Gerak Tari Lulo melalui Kegiatan
Ekstrakurikuler pada Siswa Kelas VI SDN 37 Kendari*, section “Lulo Leba”:
https://download.garuda.kemdikbud.go.id/article.php?article=1064149&title=POLA+PELATIHAN+GERAK+TARI+LULO+MELALUI+KEGIATAN+EKSTRAKURIKULER+PADA+SISWA+KELAS+VI+SDN+37+KENDARI&val=15961

Implementation lives in `public/assets/sultra-lulo.js`:

- Radius increases from 2.5 to 3.25, with 16 dance positions and eight spectators.
- Two participants alternate between dancing, walking out, watching, and joining.
  Their empty positions provide gaps, so they do not walk through other dancers.
- Spectators use staggered idle, greeting, and happy clips with pose blending,
  subtle weight shifts, and occasional glances.
- Walking clip time advances with distance traveled. Its weight is explicitly
  restored after the native PassiveCitizen controller updates its idle animation.
- Existing models and clips are reused. Detailed crowd updates run within 55
  world units of the player, and stop when the document is hidden.

Browser checks cover continuous positions at the entry/exit boundaries, finite
joint rotations, different spectator gestures, animated walking knees, and
walking clip weight while a participant is moving.
