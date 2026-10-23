# Rencana kerja Sultrarupa

Diperbarui: 13 Oktober 2026  
Dokumen ini adalah daftar kerja aktif untuk proyek. Status akan diperbarui setelah sebuah bagian benar-benar diuji di browser, bukan hanya setelah kodenya ditulis.

## Status

- `[x]` selesai dan sudah diverifikasi pada alur terkait.
- `[~]` sudah diimplementasikan, tetapi masih menunggu uji integrasi akhir.
- `[ ]` belum dikerjakan atau masih bergantung pada pekerjaan sebelumnya.

## Batas dan keputusan proyek

- Hanya ada satu pulau yang dapat dimainkan: `IslandWest`. `IslandIntro` dipakai untuk adegan kapal pembuka dari pulau yang sama.
- Berkas dunia/pulau lama tidak dihapus. Backup runtime dan aset lama tetap ada di `backups/pre-sulawesi/` dan `public/`.
- Bentuk pulau mengikuti siluet Sulawesi yang disederhanakan untuk permainan dan penempatan budaya adalah ruang pamer interpretatif, bukan klaim lokasi geografis sebenarnya.
- Rumah, foto, musik Lulo, kapal pembuka, karakter utama, serta logo MUNAS memakai aset yang sudah disediakan/ada. Tidak mengganti konten yang sudah disetujui tanpa instruksi baru.
- Interaksi utama menggunakan sistem game bawaan bila tersedia. Untuk NPC dipakai chat bawaan; rumah memakai interaksi dunia yang tidak menambah ikon atau nama melayang.
- Tidak ada pagar kayu, lapisan batu kasar, label rumah, atau ikon budaya tambahan di atas NPC. Tembok pantai memakai aset `Wall` halus bawaan game.
- Semua menu HP bawaan tetap tersedia: peta, Jelajahi Budaya, poin/toko busana, pengaturan karakter/busana, dan quest. Perubahan konteks budaya tidak boleh menghilangkan menu, saldo poin, pembelian barang, atau kustomisasi yang belum masuk tahap pengerjaan.
- Misi asli dan sistem hadiah poin dipertahankan sampai migrasi misi budaya dikerjakan secara terpisah. Konten quest lama belum seluruhnya relevan dengan Sulawesi Tenggara; status tersebut tidak diselesaikan dengan menyembunyikan menunya.
- Logo judul pembuka/loading harus bertuliskan **SULTRA RUPA** dengan karakter visual logo bawaan. Ganti lettering pada artwork vektor dua baris dan geometri adegan aslinya; jangan menghilangkan logo atau menempelkan teks biasa di atasnya.

## 1. Pulau budaya Sulawesi Tenggara

### 1.1 Struktur pulau dan lingkungan

- [x] Menyisakan satu pulau aktif dan menjaga pulau-pulau lama sebagai backup.
- [x] Membentuk daratan menyerupai huruf K/siluet Sulawesi dengan batas laut yang aman.
- [x] Mempertahankan shader tanah, rumput alami, pohon, semak, batu, bayangan, dan air dari game awal.
- [x] Menata delapan bukit landai tanpa membuat rumah, panggung, titik spawn, atau jalur utama tidak dapat dilalui.
- [x] Mengurangi tanah gersang/pasir agar rumput tetap dominan.
- [x] Menambahkan tiga belas jalur batu yang menghubungkan spawn, empat rumah, pemandu, dan panggung Lulo.
- [x] Menempatkan pohon/semak mengikuti tinggi terrain dan menjaga jalan/pelataran tetap bersih.

**Kriteria selesai:** terrain tidak tampak datar atau burik, rumah tidak melayang/menembus tanah, jalan dapat dilewati, dan pemain tidak jatuh karena celah terrain.

### 1.2 Tembok pantai dan tembok taman

- [x] Mengganti pagar kayu dengan tembok batu halus dari aset asli `Wall`.
- [x] Membuat 235 segmen tembok pantai tertutup, ditanam sebagian ke bawah air seperti aset referensi bawaan.
- [x] Menambahkan collider kontinu agar pemain tertahan di tepi laut.
- [x] Menambahkan enam tembok taman rendah memakai aset halus yang sama.
- [x] Memindahkan tembok taman yang sebelumnya memotong jalan; jarak aman dari tepi jalan sudah diverifikasi.
- [ ] Melakukan cek visual akhir dari beberapa sisi pantai pada build terakhir, setelah semua perubahan UI/narasi digabung.

**Kriteria selesai:** pantai terlihat seperti retaining wall halus referensi, bukan pagar atau tumpukan batu; berjalan ke laut pada beberapa titik hanya membuat pemain berbenturan/menyusuri tembok.

### 1.3 Rumah, pemandu, dan Lulo

- [x] Memasang model Rumah Laika, Bharugano Wuna, Banua Tada, dan Mekongga beserta foto serta informasi budaya.
- [x] Memisahkan pemandu dari rumah/jalan dan mengaktifkan gerak NPC bawaan agar mereka tidak diam.
- [x] Menyiapkan enam pemandu dengan dialog budaya dari data/sumber yang sama dengan direktori HP.
- [x] Menempatkan panggung Lulo dengan empat speaker asli, dua belas NPC menari membentuk lingkaran, serta musik Lulo berbasis jarak.
- [x] Menyinkronkan musik Lulo dengan mute game dan menghentikannya saat pemain menjauh.
- [ ] Melakukan pemeriksaan visual akhir panggung, arah speaker, gerak dua belas penari, dan jarak audio setelah build final.

**Kriteria selesai:** NPC berjalan atau menari dengan wajar, tidak berhimpitan pada rumah, dialog budaya sesuai target, dan musik Lulo hanya terdengar saat mendekat.

### 1.4 Tugu MTQ dan Patung Oputa

- [x] Menyiapkan salinan GLB web dari dua folder model pengguna tanpa mengubah berkas aslinya; total ukuran sekitar 4,94 MB.
- [x] Menggunakan tekstur diffuse PBR asli dan material unlit agar seluruh sisi tetap terang tanpa bergantung pada arah cahaya atau kabut.
- [x] Menempatkan Tugu MTQ setinggi 16 satuan di ujung paling atas lengan K, pada `(160.5, 3, -127.5)`.
- [x] Menempatkan Patung Oputa setinggi 10 satuan pada `(18, 3, 65)`, di ruang kosong yang terpisah dari rumah dan area jelajah NPC.
- [x] Menambah dua cabang jalan batu, pelataran kecil dan collider; memperbarui terrain, masker rumput, layout dan jalur peta HP dari data yang sama.
- [x] Memastikan kedua tapak datar dan tidak memotong jalan utama, tembok atau area NPC. Satu pohon serta semak di tapak MTQ dibersihkan; delapan bukit, rumah, panggung dan tembok lama dipertahankan.
- [x] Memeriksa model depan/belakang di browser, lima menu HP, peta, error JavaScript, lint dan build akhir. Koreksi encoding tekstur khusus renderer bawaan memastikan hasil web seterang preview aset.

**Batas sesi ini:** setelah kedua monumen selesai dan diverifikasi, berhenti dan tanyakan kepada pengguna pekerjaan mana yang akan dilanjutkan. Backlog berikutnya tidak dikerjakan otomatis.

## 2. Interaksi rumah dan NPC

### 2.1 Interaksi rumah tanpa ikon dunia

- [x] Menghapus ikon dan nama rumah yang dulu melayang di atas bangunan.
- [x] Menambahkan sorotan hangat pada rumah yang berada dalam jarak lima satuan dari pemain.
- [x] Menyediakan tiga cara membuka rumah: `Space`, klik mouse pada mesh rumah, dan ketuk pada mesh rumah.
- [x] Memastikan drag sentuh tidak dianggap sebagai ketukan rumah.
- [x] Mendahulukan interaksi chat NPC saat tombol chat bawaan sedang aktif.
- [~] Menyesuaikan framing kamera rumah agar bangunan tetap menjadi fokus saat balon cerita tampil di atas layar.

**Kriteria selesai:** tidak ada label/ikon rumah di dunia; setiap bagian rumah yang terlihat dapat diklik/ditap; `Space` hanya membuka rumah yang sedang disorot; kamera kembali normal ketika cerita ditutup.

### 2.2 Balon cerita rumah seperti percakapan NPC

- [~] Mengganti panel pembaca panjang menjadi balon percakapan putih di bagian atas tengah layar, dengan ekor balon mengarah ke rumah, gaya visual yang mengikuti chat NPC bawaan.
- [~] Membagi seluruh deskripsi rumah menjadi halaman pendek berdasarkan kalimat, tanpa menghilangkan isi deskripsi.
- [~] Menambahkan nomor halaman, tombol `Kembali`, `Lanjut`, dan `Selesai`.
- [~] Membuat `Space` memajukan halaman cerita, bukan menggulir teks atau melompat.
- [~] Menambahkan tombol `Info lengkap` agar foto, semua fakta, dan sumber tetap bisa dibaca dari panel lengkap.
- [~] Menambahkan tombol `Kembali ke cerita` dari info lengkap ke halaman balon terakhir.
- [ ] Menyelesaikan cek keyboard, mouse, dan sentuh untuk urutan halaman pertama → terakhir → tutup → kamera/kontrol pulih.

**Kriteria selesai:** tampilan terasa seperti bertanya kepada NPC: satu potongan cerita per balon, `Space` atau `Lanjut` membawa ke bagian berikutnya, dan tidak ada teks panjang yang harus digulir untuk mengikuti cerita utama.

### 2.3 Percakapan NPC bawaan

- [x] Menghapus marker budaya tambahan pada NPC.
- [x] Memakai ikon chat dan interaksi `Space` bawaan game untuk memulai percakapan.
- [x] Membuat kamera menyorot pemandu, mengunci gerak pemain, lalu mengembalikan kamera/kontrol saat percakapan selesai atau Escape.
- [x] Membagi penjelasan tiap budaya menjadi beberapa gelembung singkat dengan gestur bawaan.
- [ ] Menguji semua enam pemandu pada build terakhir, termasuk halaman dialog, Escape, dan pemulihan kamera.

**Kriteria selesai:** NPC terasa seperti karakter game asli; tidak ada UI rumah yang muncul ketika chat NPC dipilih; setiap pemandu menyampaikan cerita yang sesuai dengan budayanya.

## 3. Narasi suara Indonesia

- [x] Membuat rekaman MP3 neural Indonesia `id-ID-GadisNeural` untuk empat rumah, enam pemandu/Lulo, dan halaman cerita rumah.
- [x] Mengubah tempo menjadi lebih cepat (`+10%`) dan membatasi bacaan pada deskripsi saja: tanpa judul, region, subtitle, fakta, atau daftar sumber.
- [x] Menyimpan rekaman secara statis di `public/audio/culture/`, sehingga pemain tidak memanggil layanan TTS ketika game dimainkan.
- [x] Membuat manifest berisi URL, hash, durasi, teks halaman, dan pemetaan halaman balon ke audio yang tepat.
- [x] Memutar audio halaman yang aktif dan menghentikan audio halaman sebelumnya saat `Lanjut`/`Kembali` dipilih.
- [x] Menyediakan `Dengarkan` dan `Hentikan narasi`.
- [x] Menghentikan narasi ketika cerita ditutup, cerita berganti, mute aktif, tab disembunyikan, atau audio gagal.
- [x] Memastikan fallback hanya memakai suara sistem berbahasa Indonesia; suara default beraksen asing tidak dipakai.
- [ ] Memutar rekaman halaman pertama dan berikutnya dari setiap rumah di browser aktual, termasuk stop/restart/mute/close pada desktop serta sentuh.

**Kriteria selesai:** suara terdengar natural berbahasa Indonesia, lebih cepat namun tetap jelas, hanya membaca potongan deskripsi pada balon yang sedang tampil, dan tidak ada audio yang tertinggal setelah cerita beralih/ditutup.

## 4. Peta dan direktori HP

- [x] Menyesuaikan peta HP dengan bentuk pulau baru, jalur, empat rumah, pemandu, panggung, dan posisi pemain.
- [x] Memindahkan direktori budaya ke tab **Jelajahi Budaya**.
- [x] Menghapus kartu “Jelajah Sulawesi Tenggara” dari kiri bawah layar.
- [x] Menyediakan 11 kartu: empat rumah, enam pemandu, dan panggung Lulo.
- [x] Menjaga gulir/touch, fokus, modal, dan tab peta HP tetap berfungsi di desktop dan mobile.
- [x] Memulihkan kelima menu HP bawaan beserta HUD saldo poin; semua tab dapat dibuka lewat navigasi pada pengujian desktop.
- [x] Memulihkan halaman **Poin & Busana** dengan saldo, barang, harga, dan CTA pembelian, serta halaman **Atur Karakter** dengan preview dan tombol pengaturan busana.
- [x] Memverifikasi kelima tombol menu muat di layar 390 × 844; halaman poin/toko dan kustomisasi dapat dibuka pada layar sentuh tanpa error JavaScript.
- [ ] Memastikan `Info lengkap` dari rumah dunia dan kartu HP memakai isi yang konsisten, sementara kartu HP tidak memulai narasi otomatis.

**Kriteria selesai:** peta HP dan dunia memakai layout yang sama; semua kartu dapat dibuka; tidak ada HUD jelajah lama yang kembali muncul; kelima menu bawaan, saldo poin, toko, dan pengaturan busana tetap tersedia.

## 4.1 Konteks Sultra Rupa dan tema HP bawaan

- [~] Mengganti judul, metadata, preloader, label menu, petunjuk, dan pesan umum yang masih menyebut merek lama atau layanan bank menjadi konteks Sultra Rupa, sambil mempertahankan fungsi sistem poin.
- [x] Membatalkan penyembunyian menu Accessories, Customization, Quests, dan HUD poin; menjelaskan fungsi poin/toko secara jelas sebagai **Poin & Busana**.
- [x] Mengganti lettering logo loading menjadi artwork vektor **SULTRA RUPA** dua baris putih/toska, serta memakai geometri dari outline yang sama pada mesh judul pembuka. QA visual desktop dan ponsel 390 × 844 lulus, termasuk penyesuaian ukuran judul agar utuh pada layar sempit. Animasi/kemiringan/material native tetap digunakan.
- [x] Memakai artwork yang sama pada header dan menu. Ukuran header 105 × 50,7 dan menu 180 × 86,9 mengikuti layout bawaan; screenshot menu desktop/mobile lulus. SVG tidak diganti ulang setiap frame, dan selector animasi/ukuran komponen tetap terpelihara.
- [x] Mengubah tab HP budaya menjadi **Jelajahi Budaya**, dengan susunan, tipografi Gilmer, skala, warna gradien, kartu, respons tekan, dan navigasi yang mengikuti pola UI HP bawaan.
- [x] Menyesuaikan peta HP budaya dengan pola panel peta bawaan. Uji setelah lima menu dipulihkan: 11 pin tersedia; klik hanya membuka konfirmasi; Batal tidak memindahkan pemain; Arahkan saya menggunakan titik tujuan yang sesuai.
- [x] Memeriksa navigasi HP desktop dan ponsel: kelima menu terlihat, perpindahan tab berjalan, grid barang/harga dan pengaturan karakter tampil, tanpa error JavaScript. Bukti pengujian: `C:\Users\user\Downloads\munas_edit\phone_restore_features_test.py` dan screenshot `phone_restored_*.png`.
- [ ] Menuntaskan audit relevansi sisa konten lama, termasuk isi misi dan nama layanan pada halaman Quests. Menu dan sistem quest tetap aktif selama pekerjaan ini belum selesai.

**Kriteria selesai:** judul pembuka/loading memakai logo Sultra Rupa yang menyatu dengan gaya bawaan; halaman Jelajahi dan peta terasa seperti bagian asli dari HP game; semua fitur HP tetap tersedia. Migrasi konteks menyeluruh belum dapat dinyatakan selesai selama isi quest lama masih belum diproses.

### 4.2 Backlog migrasi quest dan hadiah budaya

- [ ] Merancang misi budaya beserta syarat progres, hadiah poin, dan keterkaitannya dengan rumah, NPC, serta aktivitas pulau.
- [ ] Mengganti isi misi lama secara bertahap sambil menjaga progres, saldo poin, pembelian barang, dan menu kustomisasi tetap bekerja.
- [ ] Memverifikasi perolehan poin, klaim hadiah, pembelian busana/aksesori, serta pemakaian barang setelah migrasi.

**Status saat ini:** quest asli masih dipertahankan dan bisa dibuka. Sebagian kartu masih berisi misi/nama layanan bawaan yang belum dimigrasikan; tidak menghapus atau menonaktifkan quest untuk menutupi sisa pekerjaan ini.

## 5. Pembukaan dan konten lama yang harus dipertahankan

- [x] Mempertahankan kapal model baru pada adegan awal.
- [x] Mempertahankan karakter utama dengan rig/gerak yang telah diperbaiki.
- [x] Mempertahankan logo MUNAS IX raksasa, kabut/awan, dan posisi adegan pembukaan yang sudah disetujui.
- [x] Tidak menggerakkan logo sebagai respons arah pemain setelah berada di dunia utama.
- [ ] Menjalankan smoke test pembukaan kapal → masuk pulau untuk memastikan perubahan pulau/UI tidak merusak adegan ini.

**Kriteria selesai:** dari halaman awal hingga pemain tiba di pulau, kapal, karakter, logo, dan perpindahan scene tetap muncul tanpa error.

## 6. Urutan pelaksanaan sisa pekerjaan

1. Selesaikan dan rapikan balon cerita rumah agar posisinya benar-benar menyerupai dialog NPC.
2. Hubungkan halaman balon dengan MP3 narasi per halaman dan cek kecepatan/pengucapan aktual.
3. Sesuaikan framing kamera agar rumah tetap terlihat di bawah balon, pada layar desktop dan ponsel.
4. Uji keempat rumah melalui `Space`, klik mouse, dan ketuk; uji drag sentuh sebagai gerakan biasa.
5. Uji enam pemandu dengan chat bawaan, termasuk prioritas chat terhadap rumah.
6. Pertahankan hasil koreksi logo Sultra Rupa dan seluruh fitur HP; lanjutkan audit konteks lama dengan migrasi isi quest sebagai backlog terpisah.
7. Uji HP: 11 kartu, peta dengan konfirmasi perjalanan, isi lengkap, serta tidak ada autoplay suara dari kartu HP; pemeriksaan kelima menu/poin/toko/kustomisasi desktop dan mobile sudah lulus.
8. Uji lingkungan: tembok pantai, jalur, bukit, Lulo, spawn, dan pembukaan kapal.
9. Jalankan build, lint, cek error browser, lalu perbarui dokumentasi/daftar hasil uji.

## 7. Matriks penerimaan akhir

| Alur | Hasil yang wajib terlihat |
| --- | --- |
| Dekati rumah | Hanya rumah bercahaya; tidak ada ikon/nama mengambang. |
| Tekan Space pada rumah | Kamera menyorot rumah, balon cerita halaman 1 muncul, audio halaman 1 mulai. |
| Tekan Space/Lanjut | Balon berpindah ke halaman berikutnya, audio sebelumnya berhenti dan audio halaman baru mulai. |
| Klik/ketuk rumah | Hasil sama seperti Space; drag tidak membuka cerita. |
| Info lengkap | Foto, deskripsi utuh, fakta, dan sumber tersedia; dapat kembali ke balon cerita. |
| Dekati NPC | Hanya chat bawaan tampil; Space memulai dialog dan kamera fokus pada NPC. |
| Tutup cerita/chat | Audio berhenti, kamera dan kontrol pemain kembali normal. |
| Buka Jelajahi Budaya | 11 kartu budaya dapat digulir dan dibuka; tidak ada autoplay narasi. |
| Buka navigasi HP | Kelima menu tetap terlihat dan dapat dibuka; toko/poin, kustomisasi busana, serta quest tidak disembunyikan. |
| Buka Poin & Busana | Saldo poin, barang, harga, dan mekanisme pembelian bawaan tersedia. |
| Buka Atur Karakter | Preview karakter dan kontrol pengaturan busana/aksesori tetap tersedia. |
| Loading dan judul pembuka | Logo membaca SULTRA RUPA dengan artwork/geometri serta karakter visual bawaan, bukan teks biasa yang ditempel. |
| Jalan ke tepi laut | Tembok Wall halus menahan pemain; tidak ada pagar kayu/celah jatuh. |
| Masuk dari pembukaan | Kapal, karakter, logo MUNAS, terrain, rumah, NPC, dan UI dapat dimuat tanpa error. |

## 8. Verifikasi yang akan dicatat sebelum dinyatakan selesai

- Build produksi Next.js berhasil.
- ESLint untuk seluruh modul yang berubah berhasil.
- `git diff --check` bebas error whitespace.
- Browser desktop dan layar sentuh tidak menghasilkan error JavaScript.
- Screenshot bukti untuk balon rumah, interaksi sentuh, NPC chat, peta HP, Lulo, tembok pantai, dan pembukaan disimpan di folder pengujian.
- Tidak ada aset/backup lama yang dihapus selama implementasi.

### Hasil verifikasi koreksi menu dan logo — 13 Oktober 2026

- Build produksi `npm run build` berhasil. Ada peringatan metadataBase belum ditentukan untuk URL share deployment.
- `npm run lint` berhasil tanpa error; dua peringatan anonymous default export berada di modul layout dan manifest narasi yang dihasilkan generator.
- Pemeriksaan sintaks modul shell, judul intro, dan MUNAS serta `git diff --check` berhasil.
- Lima tab HP dan HUD poin tampil pada desktop/ponsel; toko menampilkan saldo, barang dan harga; kustomisasi karakter tetap dapat dibuka.
- Direktori memiliki 11 kartu dan gulir aktif. Peta memiliki 11 pin, Batal tidak memindahkan pemain, dan Arahkan saya menggunakan titik tujuan budaya.
- Logo loading memakai SVG dua baris; landing memakai geometri pada mesh intro asli. Pada ponsel 390 × 844 judul utuh dan tombol Mulai jelajah terlihat. Tidak ada error JavaScript pada uji pembukaan.
- Logo menu desktop/mobile memakai ukuran dan animasi native. Uji kestabilan node SVG serta error browser lulus; bukti `sultra_menu_logo_audit.png` dan `sultra_menu_logo_mobile_audit.png` pada folder pengujian yang sama.
- Bukti: `C:\Users\user\Downloads\munas_edit\sultra_brand_loading.png`, `sultra_brand_landing_desktop.png`, `sultra_brand_mobile_fresh.png`, dan `phone_restored_*.png`.

### Hasil verifikasi monumen — 13 Oktober 2026

- Regenerasi terrain/layout lulus validasi: dua tapak datar, akses jalan tersambung, tidak memotong area NPC atau tembok. Terdapat 15 jalur, 142 pohon, delapan bukit dan 235 segmen tembok pantai.
- Browser memuat dua model pada posisi final, dasar keduanya tepat di `Y=3`, tinggi MTQ 16 dan Oputa 10. Material memiliki tekstur, dua sisi, unlit, fog/tone mapping nonaktif, serta encoding yang sesuai renderer.
- Cek visual depan dan belakang memperlihatkan kedua monumen terang dengan detail tekstur asli. Screenshot tersimpan di `C:\Users\user\Downloads\munas_edit\tugu-mtq-placed.png`, `tugu-mtq-placed-back.png`, `patung-oputa-placed.png`, dan `patung-oputa-placed-back.png`.
- Lima menu HP dan 11 pin budaya tetap tersedia; tidak ada error JavaScript. Skrip: `C:\Users\user\Downloads\munas_edit\monuments_world_test.py`.
- Build produksi berhasil; lint tanpa error, dengan dua peringatan generator yang telah dicatat sebelumnya. Pemeriksaan sintaks, lint modul setelah koreksi encoding, dan `git diff --check` berhasil. Peringatan metadataBase deployment masih sama.
- Pekerjaan monumen selesai. Berhenti di sini sesuai permintaan pengguna, menunggu pilihan pekerjaan berikutnya.

### Penggantian model pemandu monumen - 23 Oktober 2026

- Model base_basic_shaded.glb (79,8 MB) dikompresi menjadi public/models/culture/monument-guide.glb (12,04 MB, 1.999.846 segitiga, galat posisi maksimum 0,1 mm, tekstur identik).
- Kedua NPC NPC_SultraInfo_tugu-mtq dan NPC_SultraInfo_patung-oputa memakai model itu; rig asli tetap dipakai untuk interaksi, balon dialog, dan dialog.
- Penyebab model tidak terlihat sebelumnya: root aktor NPC memakai skala 0,01, sehingga model menjadi 1,9 cm. Klon diskalakan dengan kompensasi 100x ke tinggi target 2,9 m (pemain sekitar 2,6 m), sehingga pemandu tidak lagi terlihat kecil.
- Pemuatan kembali mengikuti konsep awal: dimuat malas hanya saat pemain berada dalam radius 90 m dari pemandu, satu kali, tanpa menambah beban saat pembukaan.
- Verifikasi runtime: kedua aktor melaporkan klon terpasang, balon dialog tampil, dan tangkapan layar bersih tersimpan di C:\Users\user\Downloads\sultra-bukti-npc.

### Fisika dan animasi jogger - 24 Oktober 2026

- Jogger keliling peta sebelumnya digerakkan dengan menimpa posisi visual setiap frame, sedangkan collider fisikanya tertinggal di titik spawn, sehingga pemain bisa menembus karakternya.
- Rute jogger kini dikonversi menjadi kurva BEZIER tertutup di manifest scene (curves), lalu aktor memakai gerak bawaan NPC (curve=..., run, speed=6). Posisi visual mengikuti body.center dari physics worker, jadi collider selalu berada tepat di karakter.
- Animasi Run hanya dipilih mesin di atas ~5,7 m/s; karena itu kecepatan dinaikkan dari 3,05 ke 6 m/s. Runtime memastikan currentAnimation=Run dan moveAnims.Run.weight=1.
- Uji tabrakan: sphere mode 256 di dekat pemain mendorong posisi pemain dari x=-52,296 ke -53,768 dan menahannya; cullSphere mengembalikan keadaan. Collider jogger memakai jalur yang sama.

### Perbaikan rute jogger - 24 Oktober 2026

- Tenggelam: rute lama menggabungkan path0 dan path12, lalu kurva tertutup menambah segmen penutup dari ujung path12 (146.83, -115.93) ke awal path0 (-61.67, 145.07). Tangen bezier membengkak ke arah laut, dan physics worker menurunkan NPC ke dasar laut (y sekitar 0,99).
- Manjat tembok: seluruh layout.paths ternyata menyusur tembok/pagar solid, dengan jarak bersih hanya 0,7-3,7 m. Raycast moveSphereToFloor dari pusat badan +0,5 m ke bawah 1,2 m mengenai tembok, lalu badan dinaikkan ke atasnya.
- Rute diganti menjadi loop pantai dekat spawn: [[-48,146],[-36,146],[-36,120],[-48,120]] (keliling sekitar 80 m), bebas tembok, jarak bersih minimum 4,8 m dari rumah mekongga. Kurva BEZIER tertutup memakai tangen Catmull-Rom dan y tetap di GROUND.
- Uji runtime: jogger berputar di x -49..-34,8 dan z 117..148, y 3,05-6,14 (menyeberangi bukit asli), lap sekitar 13 detik pada 6 m/s. Visual dan collider tetap satu body; tidak turun ke laut dan tidak naik tembok.
- Bukti: jogger-east-clean.jpg (jogger di kaki bukit, x=-35,1 z=141,4, y=3,05).
