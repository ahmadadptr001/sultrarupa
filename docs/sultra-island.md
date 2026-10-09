# Pulau budaya Sultrarupa

Satu pulau dapat dijelajahi (`IslandWest`). `IslandIntro` adalah tampilan pulau yang sama untuk adegan kapal pembuka, bukan pulau tujuan tambahan. Bentuk daratan menggunakan garis pantai Sulawesi dari Natural Earth, disederhanakan untuk permainan. Penempatan rumah dan pemandu merupakan ruang pamer interpretatif, bukan lokasi geografis atau batas administratif daerah.

## Isi dan perilaku

- Rumah Laika, Bharugano Wuna, Banua Tada, dan Mekongga memakai model serta foto yang disediakan pengguna. Salinan model untuk web dioptimalkan; berkas sumber di Downloads tidak diubah.
- Material tanah, rumput tertiup angin, pohon, semak, batu, tembok, dan susunan speaker menggunakan aset/renderer game sebelumnya. Masker tanah dan rumput dibuat ulang untuk garis pantai dan jalur baru. Pada kualitas grafis terendah, rumput tetap tampil dalam radius kecil di dekat pemain.
- Enam pemandu berjalan memakai fisika dan animasi NPC bawaan. Area jelajahnya berjarak dari bangunan, jalan masuk, dan tepi pantai. NPC berhenti ketika diajak berinteraksi.
- Ikon rumah ditempatkan di kaki tangga/pintu masuk. Banua Tada menggunakan sisi utama model yang berbeda dari tiga rumah lainnya.
- Area Lulo memiliki speaker asli, informasi budaya, dan lingkaran 12 NPC. Gerakan menggunakan rig asli dengan penyesuaian tangan dan langkah kecil khusus kelompok ini.
- Musik pengguna disimpan sebagai `public/audio/lulo.mp3`. Berkas diputar secara streaming setelah interaksi browser, terdengar dalam jarak 28 satuan dari speaker, mengecil saat menjauh, serta mengikuti mute. Tidak dimuat sebagai bagian dari preloader awal.
- Tab peta HP asli dan peta budaya memakai `sultra-island-layout.js` yang sama. Pin rumah/panggung membuka informasi; posisi pemain dan pemandu mengikuti keadaan permainan.
- Kapal, model karakter utama, dan logo MUNAS pada pembukaan tetap memakai modul tersendiri.

## Berkas utama

- `public/assets/sultra-island.js`: manifest pulau aktif, aset lingkungan, rumah, pemandu dan interaksi.
- `public/assets/sultra-island-layout.js`: geometri peta dan posisi bersama.
- `public/assets/sultra-culture-data.js`: teks budaya, foto dan tautan sumber.
- `public/assets/sultra-culture-ui.js` / `.css`: ikon dunia dan informasi budaya.
- `public/assets/sultra-phone-map.js`: integrasi tab peta HP.
- `public/assets/sultra-lulo.js`: kelompok penari dan audio area Lulo.
- `scripts/build-sulawesi-island.py`: membangun GLB terrain, collider rumah, tekstur splatting, dan layout.
- `scripts/build-culture-assets.py`: optimasi salinan GLB rumah melalui Blender.

Bangun ulang terrain/layout dari root repositori:

```powershell
uv run --with numpy --with shapely --with mapbox-earcut --with pillow python scripts/build-sulawesi-island.py
```

Data sumber garis pantai berada di `data/geography/natural-earth-indonesia.geojson`, berasal dari [Natural Earth 1:50m countries](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson) ([public domain](https://www.naturalearthdata.com/about/terms-of-use/)). Sumber penjelasan budaya dicantumkan pada setiap entri dan tampil di panel informasi.

## Backup dunia sebelumnya

Model, tekstur, scene, dan kode bawaan pulau lama tetap berada di `public/`. Perubahan daftar pulau dilakukan pada manifest saat runtime; berkas pulau lama tidak dihapus. Manifest sebelum perubahan dan salinan modul khusus berada di `backups/pre-sulawesi/`.

Untuk kembali ke dunia sebelumnya pada pengembangan, lepaskan import dan pemanggilan `installSultraIsland(game)` dari `public/assets/munas-landmark.js`, lalu muat ulang halaman. Modul kapal, karakter dan logo dapat tetap aktif. Bersihkan hanya nilai `player_position` dan `sultrarupa-island-layout` pada localStorage jika posisi tersimpan berada di luar daratan dunia lama; jangan menghapus seluruh data pengguna.

Perubahan layout baru perlu versi migrasi posisi pada `sultra-island.js` bila titik awal atau daratan di sekitar posisi pemain berubah.
