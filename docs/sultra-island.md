# Pulau budaya Sultra Rupa

Satu pulau dapat dijelajahi (`IslandWest`). `IslandIntro` adalah tampilan pulau yang sama untuk adegan kapal pembuka, bukan pulau tujuan tambahan. Bentuk daratan menggunakan garis pantai Sulawesi dari Natural Earth, disederhanakan untuk permainan. Penempatan rumah dan pemandu merupakan ruang pamer interpretatif, bukan lokasi geografis atau batas administratif daerah.

## Isi dan perilaku

- Rumah Laika, Bharugano Wuna, Banua Tada, dan Mekongga memakai model serta foto yang disediakan pengguna. Salinan model untuk web dioptimalkan; berkas sumber di Downloads tidak diubah.
- Material tanah, rumput tertiup angin, pohon, semak, batu, tembok, dan susunan speaker menggunakan aset/renderer game sebelumnya. Masker tanah dan rumput dibuat ulang untuk garis pantai dan jalur baru. Pada kualitas grafis terendah, rumput tetap tampil dalam radius kecil di dekat pemain.
- Tembok batu halus mengelilingi pantai, memakai mesh dan palet asli aset `Wall` bawaan game. Dasarnya tertanam hingga di bawah air; 235 segmen mengikuti garis pantai, tanpa lapisan batu kasar atau pagar kayu. Enam tembok rendah di sekitar rumah memakai aset yang sama; collider-nya ditempatkan di luar lebar jalan beserta jarak aman. Sambungan overlap dan collider tepi yang kontinu menahan karakter agar tidak jatuh ke laut. Tiga belas jalur batu menghubungkan spawn, pintu rumah, pemandu dan panggung. Pita pasir serta pelataran diperkecil agar rumput lebih dominan.
- Delapan bukit landai memberikan variasi ketinggian. Jalan mengikuti permukaan, sementara rumah, panggung, spawn dan area jelajah pemandu tetap datar. Pohon serta semak mengikuti tinggi tanah.
- Tugu MTQ berada di ujung paling atas lengan K pada `(160.5, 3, -127.5)`, tinggi 16 satuan. Patung Oputa berada pada `(18, 3, 65)`, tinggi 10 satuan. Dua cabang jalan batu dan pelataran kecil menghubungkannya ke 13 jalur sebelumnya. Kedua tapak memiliki collider dan diperiksa terhadap tepi pantai, jalan, tembok taman, area NPC serta tinggi terrain. Satu pohon dan semak di tapak MTQ dibersihkan; lingkungan lainnya dipertahankan.
- Kedua monumen memakai salinan GLB dengan tekstur diffuse dari model PBR asli, tanpa pencahayaan arah yang tertanam pada varian shaded. Material GLB memakai `KHR_materials_unlit`; runtime memakai `MeshBasicMaterial`, warna pengali putih netral, `fog=false` dan `toneMapped=false`, sehingga seluruh sisi mempertahankan warna tekstur tanpa menjadi gelap karena arah lampu. MTQ berukuran 2,32 MB/69.588 segitiga; Oputa 2,62 MB/89.996 segitiga. Model juga tampil pada preview pulau intro; berkas asli pengguna tetap utuh.
- Renderer r150 bawaan menampilkan warna secara langsung, tanpa encoding output sRGB. Karena itu khusus tekstur monumen digunakan `encoding=3000` (`LinearEncoding`) agar warna sRGB asli tidak didekode lalu ditampilkan sebagai linear yang tampak gelap. Mengubah `colorSpace` saja tidak cukup pada versi renderer ini. Koreksi dibatasi pada dua monumen; GLB tetap menyimpan tekstur diffuse sRGB standar.
- Enam pemandu berjalan memakai fisika dan animasi NPC bawaan. Area jelajahnya berjarak dari bangunan, jalan masuk, dan tepi pantai. Percakapan menggunakan **Space** atau ikon chat bawaan, tanpa pin budaya tambahan di atas orang. Kamera menyorot pemandu, gerak pemain dijeda, dan cerita budaya dari data bersumber disampaikan dalam beberapa gelembung percakapan serta gestur bawaan. Gelembung terakhir mengarahkan pembaca ke cerita lengkap dan sumber di **Jelajahi Budaya**. Kamera kembali sesudah percakapan ditutup.
- Rumah tidak lagi memiliki ikon atau label nama di dunia. Rumah terdekat menerima sorotan hangat ketika pemain berada dalam jarak lima satuan dari bangunan. **Space** membuka cerita rumah yang disorot; klik/ketuk pada bagian mesh rumah mana pun juga membukanya. Kamera bawaan mendekat untuk membingkai bangunan, lalu balon percakapan tampil di bagian atas layar. Space atau tombol Lanjut memajukan halaman balon; deskripsi, fakta, foto, dan tautan sumber lengkap tetap tersedia melalui Info lengkap. Saat balon ditutup, kamera kembali dan pemain dapat bergerak. Interaksi Space milik NPC serta klik ikon chat bawaan didahulukan. Nama rumah tetap tersedia di cerita dan direktori HP.
- Narasi memakai berkas MP3 bahasa Indonesia yang dibuat dengan suara neural `id-ID-GadisNeural`, tempo +10%, sehingga suara utama konsisten di berbagai perangkat. Setiap berkas memuat satu halaman deskripsi agar pembacaan tetap singkat. Berkas dibaca saat diperlukan, tanpa layanan TTS ketika permainan berjalan. Narasi dimulai saat cerita rumah dibuka bila browser mengizinkan; tombol **Dengarkan** dapat memulai atau mengulang, sedangkan **Hentikan narasi** membatalkannya. Panel HP menyediakan tombol yang sama tanpa suara otomatis. Narasi berhenti saat panel ditutup, cerita diganti, tab browser disembunyikan, atau suara game dimatikan. Bila MP3 gagal dimuat, hanya suara Web Speech berbahasa Indonesia yang boleh digunakan; suara asing/default tidak dipakai.
- Area Lulo memiliki speaker asli, informasi budaya, dan lingkaran 12 NPC. Gerakan menggunakan rig asli dengan penyesuaian tangan dan langkah kecil khusus kelompok ini.
- Musik pengguna disimpan sebagai `public/audio/lulo.mp3`. Berkas diputar secara streaming setelah interaksi browser, terdengar dalam jarak 28 satuan dari speaker, mengecil saat menjauh, serta mengikuti mute. Tidak dimuat sebagai bagian dari preloader awal.
- Tab peta HP asli dan peta budaya memakai `sultra-island-layout.js` yang sama. Setiap pin meminta konfirmasi tujuan, lalu mengarahkan pemain ke titik budaya; informasi tetap tersedia melalui Jelajahi Budaya atau interaksi di dunia. Posisi pemain dan pemandu mengikuti keadaan permainan.
- Kartu jelajah di kiri bawah dihapus. Direktori rumah, pemandu, panggung dan akses peta budaya tersedia di tab **Jelajahi Budaya** pada HP.
- Kelima menu HP tetap tersedia: peta, Jelajahi Budaya, Poin & Busana, Atur Karakter, dan Perjalanan. Saldo poin, toko, pembelian, kustomisasi dan sistem quest bawaan tetap aktif. Migrasi isi quest ke budaya adalah pekerjaan berikutnya; sebagian isi misi lama masih ada.
- Logo loading memakai artwork vektor dua baris Sultra Rupa dengan warna putih/toska bawaan. Judul landing mengganti geometri pada mesh intro asli, sehingga posisi, material dan animasi kamera tetap mengikuti game. Lettering diperkecil pada layar sempit agar utuh. Header/menu memakai artwork vektor yang sama.
- Kapal, model karakter utama, dan logo MUNAS pada pembukaan tetap memakai modul tersendiri.

## Berkas utama

- `public/assets/sultra-island.js`: manifest pulau aktif, aset lingkungan, rumah, pemandu dan interaksi.
- `public/assets/sultra-island-layout.js`: geometri peta dan posisi bersama.
- `public/assets/sultra-culture-data.js`: teks budaya, foto dan tautan sumber.
- `public/assets/sultra-culture-ui.js` / `sultra-culture.css`: panel informasi, balon percakapan rumah di bagian atas layar, peta budaya, serta akses narasi.
- `public/assets/sultra-house-interaction.js`: sorotan rumah, pemilihan seluruh mesh melalui klik/ketuk, Space, dan fokus kamera bawaan.
- `public/assets/sultra-guide-dialogs.js`: cerita budaya dalam beberapa gelembung percakapan NPC bawaan, beserta gestur.
- `public/assets/sultra-culture-voice.js`: pemutar narasi MP3, fallback Indonesia, penghentian dan sinkronisasi mute.
- `public/assets/sultra-narration-manifest.js` / `public/audio/culture/`: daftar rekaman, MP3, transkrip, dan metadata regenerasi.
- `scripts/build-culture-narration.py`: membangun rekaman neural Indonesia dari konten budaya yang sama.
- `public/assets/sultra-phone-map.js`: integrasi tab peta HP.
- `public/assets/sultra-phone-culture.js`: direktori budaya pada tab Jelajahi Budaya.
- `public/assets/sultra-shell-copy.js`: teks shell dan artwork header/menu, tanpa menyembunyikan fitur HP.
- `public/assets/sultra-intro-wordmark.js`: geometri lettering Sultra Rupa pada mesh judul pembuka.
- `public/branding/sultra-rupa.svg` / `public/models/sultra-rupa-wordmark.json`: artwork vektor dan geometri dari outline yang sama.
- `scripts/build-sultra-wordmark.py`: generator artwork dan geometri judul; jalankan dengan `uv run --with svgpathtools --with mapbox-earcut --with numpy --with shapely python scripts/build-sultra-wordmark.py`. SVG preloader tertanam di HTML agar langsung tampil; sinkronkan kedua path-nya bila artwork diubah.
- `public/assets/sultra-lulo.js`: kelompok penari dan audio area Lulo.
- `scripts/build-sulawesi-island.py`: membangun GLB terrain, collider rumah, tekstur splatting, dan layout.
- `scripts/sultra_terrain_features.py`: tembok batu pantai tertutup beserta validasi sambungan.
- `scripts/build-culture-assets.py`: optimasi salinan GLB rumah melalui Blender.
- `data/monument-sites.json`: posisi, ukuran, orientasi, material dan cabang jalan kedua monumen. Regenerasikan terrain setelah mengubah tapaknya.
- `scripts/build-monument-assets.py`: optimasi model PBR monumen dan ekspor diffuse unlit melalui Blender background terpisah; laporan serta preview depan/belakang/samping berada di `artifacts/monuments/`.

Bangun ulang terrain/layout dari root repositori:

```powershell
uv run --with numpy --with shapely --with mapbox-earcut --with pillow python scripts/build-sulawesi-island.py
```

Data sumber garis pantai berada di `data/geography/natural-earth-indonesia.geojson`, berasal dari [Natural Earth 1:50m countries](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson) ([public domain](https://www.naturalearthdata.com/about/terms-of-use/)). Sumber penjelasan budaya dicantumkan pada setiap entri dan tampil di panel informasi.

Bangun ulang narasi setelah isi budaya berubah:

```powershell
uv run --with edge-tts --with mutagen python scripts/build-culture-narration.py
```

Generator mengirim teks budaya publik ke layanan suara melalui [edge-tts](https://github.com/rany2/edge-tts), menyimpan MP3 beserta transkrip dan hash, serta melewati rekaman yang isinya belum berubah. Data permainan/pengguna tidak dikirim.

## Backup dunia sebelumnya

Model, tekstur, scene, dan kode bawaan pulau lama tetap berada di `public/`. Perubahan daftar pulau dilakukan pada manifest saat runtime; berkas pulau lama tidak dihapus. Manifest sebelum perubahan dan salinan modul khusus berada di `backups/pre-sulawesi/`.

Untuk kembali ke dunia sebelumnya pada pengembangan, lepaskan import dan pemanggilan `installSultraIsland(game)` dari `public/assets/munas-landmark.js`, lalu muat ulang halaman. Modul kapal, karakter dan logo dapat tetap aktif. Bersihkan hanya nilai `player_position` dan `sultrarupa-island-layout` pada localStorage jika posisi tersimpan berada di luar daratan dunia lama; jangan menghapus seluruh data pengguna.

Perubahan layout baru perlu versi migrasi posisi pada `sultra-island.js` bila titik awal atau daratan di sekitar posisi pemain berubah.
Perubahan GLB/tekstur hasil generator juga perlu kenaikan revisi `manifest.timestamp` di modul yang sama untuk memperbarui cache aset browser.

## Verifikasi perubahan lingkungan dan HP yang telah dilakukan

- Build Next.js dan ESLint modul khusus.
- Browser desktop dan perangkat sentuh: semua 11 kartu budaya, gulir daftar, modal, pemulihan fokus, pergantian tab peta dan direktori, serta ketiadaan kartu kiri bawah.
- Gerakan keenam pemandu memakai Walk bawaan; 12 penari menghadap pusat lingkaran. Audio Lulo teruji mendekat/menjauh dan mute.
- Karakter didorong ke arah laut pada dua bagian pantai; tetap di dalam tembok dan di atas tanah. Pergerakan dari puncak bukit ke lereng tidak menembus tanah.
- Ketiga belas jalur pusat berada di dalam perimeter tembok. Collider enam tembok taman tidak memotong jalan selebar 2,3 satuan; jarak terdekatnya ke tepi jalan sekitar 1,082 satuan, melampaui syarat generator 0,65 satuan. Delapan bukit memiliki kemiringan maksimum sekitar 28 derajat. Layout tidak memuat aset pagar kayu.

- Browser interaksi terbaru: keempat rumah membuka balon percakapan melalui Space, fokus kamera aktif, dua paragraf/tiga fakta/dua sumber tetap lengkap, Space memajukan halaman bacaan, dan penutupan mengembalikan kontrol. Klik bagian atap dan bawah mesh juga membuka cerita. Pada perangkat sentuh, ketukan membuka cerita dan drag tetap menggerakkan pemain tanpa membuka cerita; tidak ada error JavaScript.
- Percakapan NPC melalui Space menyorot pembicara, memajukan cerita ke gelembung berikutnya, dan memulihkan kamera/kontrol setelah Escape.
- Siklus pemutar narasi teruji untuk pergantian cerita, mute, close, tab tersembunyi, callback lama, kegagalan autoplay, serta fallback khusus Indonesia.
