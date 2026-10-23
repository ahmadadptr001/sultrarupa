const source = 'https://publikasi.dinus.ac.id/index.php/struktural/article/view/7691';
const researchCredit = {
  author: 'Dokumentasi Sitti Hermina, 2022; Hermina, Ahimsa-Putra, Kusworo, dan Fandeli',
  license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  url: source, changes: 'Foto diekstrak dari publikasi, orientasi disesuaikan, dan dikonversi ke WebP. Resolusi asli dipertahankan.',
};
const research = (id, title, file, summary, details) => ({
  id, title, category: 'Adat & seni pertunjukan', culture: 'Muna',
  image: `/images/culture/gallery/${file}.webp`, alt: `${title}, dokumentasi tradisi Karia di Muna.`,
  summary, details, sources: [{ title: 'Penelitian Linda dan Karia — Hermina dkk., 2022', url: source }], credit: researchCredit,
});
export const MUNA_GALLERY_ADDITIONS = [
  research('muna-linda', 'Tari Linda', 'muna-karia-47', 'Tarian dalam rangkaian Karia masyarakat Muna.', [
    'Foto memperlihatkan penari Linda dengan busana dan selendang. Penelitian Hermina mendokumentasikan tari ini dalam rangkaian Karia.',
    'Gerak tari diiringi musik tradisional, termasuk gong dan gendang.',
  ]),
  {
    id: 'muna-bharugano', title: 'Bharugano Wuna', category: 'Rumah & warisan budaya', culture: 'Muna · Raha',
    image: '/images/culture/gallery/muna-bharugano.webp', alt: 'Bangunan Museum Bharugano Wuna di Raha.',
    summary: 'Rumah adat yang menjadi ruang pengenalan warisan Muna.',
    details: ['Bharugano Wuna berada di Raha, Kabupaten Muna. Bangunan rumah adat ini digunakan sebagai museum untuk mengenalkan warisan budaya setempat.', 'Profil museum mencatat koleksi benda keseharian dan kerajinan, termasuk Kaghati Kolope, layang-layang berbahan daun. Foto ini menampilkan bangunan museum, bukan foto koleksi layang-layangnya.'],
    sources: [{ title: 'Profil Museum Bharugano Wuna — Kementerian Kebudayaan', url: 'https://museum.kemenbud.go.id/museum/profile/uptd%2Bmuseum%2Bbharugano%2Bwuna?page=11' }],
    credit: { author: 'Sahrulhu16 / Wikimedia Commons', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', url: 'https://commons.wikimedia.org/wiki/File:Bharugano_wuna.jpg', changes: 'Dikonversi ke WebP; isi foto tidak diubah.' },
  },
  research('muna-sulutaru', 'Sulutaru dalam Karia', 'muna-karia-43', 'Hiasan berwarna untuk tempat lilin dalam prosesi Karia.', [
    'Sulutaru dibuat dari kertas berwarna dan digunakan sebagai tempat lilin peserta Karia.',
    'Foto merupakan dokumentasi Hermina pada 2022, memperlihatkan perlengkapan tersebut bersama peserta prosesi.',
  ]),
  research('muna-karia-prosesi', 'Prosesi Karia', 'muna-karia-44', 'Peserta dan pendamping dalam dokumentasi Karia.', [
    'Karia merupakan tradisi masyarakat Muna yang mencakup beberapa tahapan. Foto ini mendokumentasikan peserta dan pendamping bersama sulutaru.',
    'Penelitian menempatkan Linda sebagai salah satu tahap dalam rangkaian tradisi tersebut.',
  ]),
  research('muna-linda-kebersamaan', 'Linda dan Kebersamaan', 'muna-karia-49', 'Pertunjukan Linda mempertemukan peserta, keluarga, dan tamu.', [
    'Dokumentasi ini memperlihatkan penari di hadapan para tamu. Linda ditampilkan bergiliran oleh peserta Karia.',
    'Penelitian mengaitkan pertunjukan tersebut dengan ungkapan kegembiraan dan penghormatan kepada orang tua.',
  ]),
];
