// Gallery photographs and descriptions are intentionally loaded only with the interior.
// Image provenance, licenses, and editorial decisions: docs/gallery-sources.md.
import { TOLAKI_GALLERY_ADDITIONS } from './sultra-gallery-tolaki.js';
import { MUNA_GALLERY_ADDITIONS } from './sultra-gallery-muna.js';
import { BUTON_GALLERY_ADDITIONS } from './sultra-gallery-buton.js';
const commons = (name) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(name.replaceAll(' ', '_'))}`;
const image = (name) => `/images/culture/gallery/${name}.webp`;
const cc = (version) => `https://creativecommons.org/licenses/by-sa/${version}/`;
const optimized = 'Ukuran diperkecil bila perlu dan dikonversi ke WebP; isi gambar tidak diubah.';

const tolakiTextile = {
  id: 'tenun-tolaki',
  title: 'Tenun Tolaki',
  category: 'Kain & busana',
  culture: 'Warisan bersama masyarakat Tolaki',
  image: image('tenun-tolaki-prangko'),
  alt: 'Prangko Indonesia tahun 2011 yang menampilkan pola kain tenun Tolaki.',
  summary: 'Ragam tenun Tolaki diabadikan pada prangko Indonesia tahun 2011.',
  details: [
    'Gambar ini adalah dokumentasi prangko seri kain tradisional Indonesia, dengan tulisan “Tenun Tolaki — Sulawesi Tenggara”. Pola kain menjadi unsur utama gambar, sehingga detail tenun dapat diamati sebagai bagian dari pengenalan warisan tekstil Tolaki.',
    'Tolaki memiliki beragam busana sesuai keperluannya, termasuk busana perkawinan, kebesaran, dan kain tenun bermotif Tolaki. Koleksi di Laika dan Mekongga ini memperkenalkan warisan tekstil bersama masyarakat Tolaki.'
  ],
  sources: [
    { title: 'Kajian pakaian adat Tolaki — Universitas Halu Oleo', url: 'https://ojs.uho.ac.id/index.php/JPSB/article/view/28863' },
    { title: 'Dokumentasi prangko Tenun Tolaki', url: commons('Stamp of Indonesia - 2011 - Colnect 963682 - Tenun Tolaki Sulawesi Tenggara.jpeg') }
  ],
  credit: { author: 'Pos Indonesia; reproduksi dari Colnect melalui Wikimedia Commons', license: 'Domain publik — Pemerintah Indonesia', url: commons('Stamp of Indonesia - 2011 - Colnect 963682 - Tenun Tolaki Sulawesi Tenggara.jpeg'), licenseUrl: 'https://commons.wikimedia.org/wiki/Template:PD-IDGov', changes: optimized }
};

const sinonggi = {
  id: 'sinonggi',
  title: 'Sinonggi',
  category: 'Kuliner',
  culture: 'Warisan bersama masyarakat Tolaki',
  image: image('sinonggi'),
  alt: 'Sinonggi dari sagu disajikan dengan kuah sayur dan ikan.',
  summary: 'Sagu bertekstur kenyal yang dinikmati bersama kuah sayur dan lauk ikan.',
  details: [
    'Sinonggi merupakan hidangan sagu dalam tradisi kuliner Tolaki. Sagu dicampur air panas sampai mengental, lalu disantap dengan kuah sayur atau ikan. Foto ini memperlihatkan salah satu penyajian sinonggi dengan lauk dan sayuran.',
    'Hidangan ini dikenal dalam keseharian maupun pertemuan keluarga. Di galeri Laika dan Mekongga, sinonggi memperkenalkan tradisi kuliner yang dinikmati bersama oleh masyarakat Tolaki.'
  ],
  sources: [
    { title: 'Sinonggi — Indonesia Travel, Kementerian Pariwisata', url: 'https://www.indonesia.travel/sa/en/travel-ideas/gastronomy/sinonggi' },
    { title: 'Kajian makanan tradisional etnik di Kendari — Universitas Terbuka', url: 'https://repository.ut.ac.id/6036/1/2012_191.pdf' }
  ],
  credit: { author: 'Akhsan05 / Wikimedia Commons', license: 'CC0 1.0', url: commons('Sinonggi.jpg'), licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', changes: optimized }
};

const molulo = {
  id: 'molulo',
  title: 'Lulo / Molulo',
  category: 'Seni pertunjukan',
  culture: 'Warisan bersama masyarakat Tolaki',
  image: image('molulo'),
  alt: 'Para peserta menari Lulo bersama dalam lingkaran pada malam hari.',
  summary: 'Gerak kaki dan gandengan tangan membentuk lingkaran kebersamaan.',
  details: [
    'Lulo atau Molulo merupakan tarian pergaulan masyarakat Tolaki. Peserta membentuk lingkaran, saling bergandengan tangan, dan mengikuti irama dengan langkah kaki. Tarian ini hadir dalam pernikahan, penyambutan tamu, serta perayaan bersama.',
    'Penelitian di Pakue, Kolaka Utara, mencatat Lulo sebagai ruang pertemuan dan persatuan masyarakat. Foto pada bingkai mendokumentasikan pertunjukan Lulo; warisannya relevan untuk masyarakat Tolaki di wilayah Konawe maupun Mekongga.'
  ],
  sources: [
    { title: 'Penelitian tradisi Lulo di Kolaka Utara — IAIN Parepare', url: 'https://repository.iainpare.ac.id/id/eprint/2011/' },
    { title: 'Lulo pada karnaval budaya — Pemerintah Kabupaten Kepulauan Selayar', url: 'https://kepulauanselayarkab.go.id/tari-lulo-sultra-tampil-pada-karnaval-budaya-hari-jadi-ke413-selayar-' }
  ],
  credit: { author: 'Miunsrv / Wikimedia Commons', license: 'CC BY-SA 4.0', url: commons('Molulo.jpg'), licenseUrl: cc('4.0'), changes: optimized }
};

const kasuami = {
  id: 'kasuami',
  title: 'Kasuami / Kasoami',
  category: 'Kuliner',
  culture: 'Tradisi kuliner Buton, Muna, dan Wakatobi',
  image: image('kasuami'),
  alt: 'Kasuami berbahan singkong dengan bentuk kerucut.',
  summary: 'Olahan singkong kukus yang dikenal di Buton, Muna, dan Wakatobi.',
  details: [
    'Kasuami, juga ditulis kasoami, dibuat dari singkong yang diparut, diperas, lalu dikukus. Bentuk kerucutnya berasal dari wadah anyaman yang digunakan saat pengukusan. Hidangan ini kerap menjadi pendamping lauk sebagai pengganti nasi.',
    'Buku kuliner terbitan Kementerian Pendidikan dan Kebudayaan mencatat penyebarannya di Buton dan sekitarnya, termasuk Muna dan Wakatobi. Kasuami hadir dalam galeri rumah Muna dan Buton sebagai bagian dari tradisi kuliner yang menghubungkan wilayah kepulauan ini.'
  ],
  sources: [
    { title: 'Rasakan Sensasi Gurihnya Kasoami — Kementerian Pendidikan dan Kebudayaan', url: 'https://budikemdikbud.id/storage/book/5IBxkEvyCAIfTnrYwMgqS8GvY4gcpnAmfsNTYuQN.pdf' },
    { title: 'Pengolahan kasoami — BPTP Sulawesi Tenggara', url: 'https://ppid.pertanian.go.id/doc/238/Laporan%20Tahunan%20BPTP%20Sultra%202012.pdf' }
  ],
  credit: { author: 'Arzan 88 / Wikimedia Commons', license: 'CC BY-SA 3.0', url: commons('Kasuami.jpg'), licenseUrl: cc('3.0'), changes: optimized }
};

const munaArchiveTitle = "COLLECTIE TROPENMUSEUM 'Drie mannen van het eiland Moena (Zuidoost-Celebes); links een adellijke man, in het midden en rechts mannen van het Reha-volk' - TMnr 10005692.jpg";
const munaArchive = {
  id: 'busana-muna-arsip',
  title: 'Busana Muna dalam Arsip',
  category: 'Busana & sejarah',
  culture: 'Muna',
  image: image('busana-muna-arsip'),
  alt: 'Foto arsip tiga pria Pulau Muna mengenakan kain, ikat kepala, dan perlengkapan busana.',
  summary: 'Dokumentasi museum memperlihatkan kain dan perlengkapan busana pria di Pulau Muna.',
  details: [
    'Arsip koleksi Wereldmuseum ini mendokumentasikan tiga pria dari Pulau Muna. Katalog museum menyebut sosok di kiri sebagai bangsawan dan dua sosok lain sebagai warga Reha. Kain, ikat kepala, serta cara mengenakan perlengkapan busana terlihat jelas pada foto.',
    'Tanggal pemotretan dan nama fotografer tidak tercatat. Sebagai dokumentasi sejarah, foto ini mengajak kita mengamati cara berpakaian pada masa lalu. Tradisi kain Muna terus berkembang; penelitian di Masalili mendokumentasikan keragaman motif serta makna sosial sarung tenun.'
  ],
  sources: [
    { title: 'Katalog Wereldmuseum, koleksi TMnr 10005692', url: commons(munaArchiveTitle) },
    { title: 'Kajian sarung tenun masyarakat Muna — Syamsumarlin, Universitas Halu Oleo', url: 'https://sciencescholar.us/journal/index.php/ijssh/article/view/80' }
  ],
  credit: { author: 'Collectie Wereldmuseum (v/h Tropenmuseum), National Museum of World Cultures; fotografer tidak diketahui', license: 'CC BY-SA 3.0', url: commons(munaArchiveTitle), licenseUrl: cc('3.0'), changes: optimized }
};

const munaRockArt = {
  id: 'liang-metanduno',
  title: 'Jejak Gambar Cadas Muna',
  category: 'Seni & warisan sejarah',
  culture: 'Pulau Muna',
  image: image('liang-metanduno'),
  alt: 'Gambar perahu pada dinding batu Liang Metanduno di Pulau Muna.',
  summary: 'Gambar perahu di Liang Metanduno membuka jendela ke warisan visual Pulau Muna.',
  details: [
    'Foto ini memperlihatkan gambar perahu pada batu di Liang Metanduno, Pulau Muna. Kawasan gua dan ceruk di sekitar Liang Kabori menyimpan banyak gambar cadas, termasuk bentuk manusia, hewan, dan perahu.',
    'Warisan arkeologi ini menambah cerita tentang Pulau Muna melalui gambar pada permukaan batu. Bentuk perahu dan figur manusia menjadi bagian dari keragaman tema seni cadas yang didokumentasikan para peneliti di kawasan tersebut.'
  ],
  sources: [
    { title: 'Dokumentasi gambar perahu Liang Metanduno — Purnawibawa', url: commons('Boat Depiction (Liang Metanduno).jpg') },
    { title: 'Tinjauan seni cadas, termasuk Pulau Muna — Balai Arkeologi Ambon', url: 'https://ejournal.brin.go.id/kapata/article/download/11788/9179/33225' }
  ],
  credit: { author: 'Purnawibawa / Wikimedia Commons', license: 'CC BY-SA 4.0', url: commons('Boat Depiction (Liang Metanduno).jpg'), licenseUrl: cc('4.0'), changes: optimized }
};

const butonTextile = {
  id: 'tenun-buton',
  title: 'Tenun Buton',
  category: 'Kain & kerajinan',
  culture: 'Buton',
  image: image('tenun-buton'),
  alt: 'Penenun mengerjakan kain Buton dengan alat tenun tradisional.',
  summary: 'Benang disusun satu per satu menjadi kain melalui keterampilan tangan penenun.',
  details: [
    'Foto Andrydenisah mendokumentasikan proses menenun di Buton pada 2019. Perhatikan susunan benang dan alat tenun yang digunakan: kain hadir melalui pekerjaan tangan yang bertahap, bukan hanya sebagai pola pada selembar tekstil.',
    'Keterangan fotografer menghubungkan tradisi ini dengan kampung tenun Sulaa. Di galeri Banua Tada, proses menenun memperlihatkan keterampilan perajin di balik kain yang menjadi bagian dari kehidupan budaya Buton.'
  ],
  sources: [
    { title: 'Dokumentasi penenun Buton dan Sulaa — Andrydenisah', url: commons('Tenun Buton.jpg') },
    { title: 'Warisan tekstil Sulawesi Tenggara — Indonesia Travel', url: 'https://www.indonesia.travel/id/id/destination/sulawesi/southeast-sulawesi' }
  ],
  credit: { author: 'Andrydenisah / Wikimedia Commons', license: 'CC BY-SA 4.0', url: commons('Tenun Buton.jpg'), licenseUrl: cc('4.0'), changes: optimized }
};

const posuo = {
  id: 'posuo-buton',
  title: 'Busana dalam Tradisi Posuo',
  category: 'Busana & adat',
  culture: 'Buton / Wolio',
  image: image('posuo-buton'),
  alt: 'Para peserta tradisi Posuo Buton mengenakan busana berhias dan hiasan kepala.',
  summary: 'Busana, riasan, dan hiasan kepala dalam dokumentasi tradisi Posuo Buton.',
  details: [
    'Posuo dikenal sebagai tradisi pingitan dalam masyarakat Buton. Foto ini mendokumentasikan peserta dengan busana dan hiasan kepala dalam kegiatan tersebut pada 2018.',
    'Kajian Balai Pelestarian Nilai Budaya tentang masyarakat Wolio di Baubau mencatat penggunaan pakaian adat kalembe pada upacara Posuo. Busana, tata rias, dan perlengkapan yang dikenakan bersama-sama membentuk penampilan seremonial dalam tradisi tersebut.'
  ],
  sources: [
    { title: 'Tata krama masyarakat Wolio di Baubau — Balai Pelestarian Nilai Budaya', url: 'https://kebudayaan.kemdikbud.go.id/bpnbsulsel/perilaku-tata-krama-dalam-dan-luar-lingkungan-kerabat-pada-masyarakat-suku-bangsa-woliodi-kota-bau-bau-nur-alam-saleh/' },
    { title: 'Dokumentasi Posuo — Miunsrv', url: commons('Gadis Buton dalam tradisi Posuo.jpg') }
  ],
  credit: { author: 'Miunsrv / Wikimedia Commons', license: 'CC BY-SA 4.0', url: commons('Gadis Buton dalam tradisi Posuo.jpg'), licenseUrl: cc('4.0'), changes: optimized }
};

export const HOUSE_GALLERIES = {
  laika: [tolakiTextile, sinonggi, molulo, ...TOLAKI_GALLERY_ADDITIONS],
  mekongga: [tolakiTextile, sinonggi, molulo, ...TOLAKI_GALLERY_ADDITIONS],
  'bharugano-wuna': [munaArchive, kasuami, munaRockArt, ...MUNA_GALLERY_ADDITIONS],
  'banua-tada': [posuo, kasuami, butonTextile, ...BUTON_GALLERY_ADDITIONS]
};
