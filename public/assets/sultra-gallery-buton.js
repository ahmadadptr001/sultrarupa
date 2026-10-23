const commons = name => `https://commons.wikimedia.org/wiki/File:${name}`;
const entry = (id, title, category, file, original, author, summary, details, publicDomain = false) => ({
  id, title, category, culture: 'Buton · Wolio', image: `/images/culture/gallery/${file}.webp`,
  alt: `${title}, dokumentasi warisan budaya Buton.`, summary, details,
  sources: [{ title: `Dokumentasi ${title}`, url: commons(original) }],
  credit: { author, license: publicDomain ? 'Domain publik — Pemerintah Indonesia' : 'CC BY-SA 4.0',
    licenseUrl: publicDomain ? 'https://commons.wikimedia.org/wiki/Template:PD-IDGov' : 'https://creativecommons.org/licenses/by-sa/4.0/',
    url: commons(original), changes: 'Ukuran diperkecil bila perlu dan dikonversi ke WebP; isi foto tidak diubah.' },
});
export const BUTON_GALLERY_ADDITIONS = [
  entry('buton-bosu', 'Tari Bosu', 'Seni pertunjukan', 'buton-tari-bosu', 'Tari_Bosu.jpg', 'Miunsrv / Wikimedia Commons',
    'Tarian yang menggambarkan aktivitas membawa air dengan wadah tanah liat.',
    ['Dokumentasi ini menampilkan Tari Bosu dari Buton. Bosu adalah wadah tanah liat yang menjadi bagian dari gambaran kegiatan mengambil air dalam tarian.', 'Foto karya Miunsrv pada 2018 memperlihatkan bagaimana aktivitas keseharian diolah menjadi pertunjukan budaya.']),
  entry('buton-meriam', 'Meriam Baluarana Jaraijo', 'Senjata & sejarah', 'buton-meriam', 'Meriam_di_Baluarana_Jaraijo.jpg', 'Marwan Mohamad / Wikimedia Commons',
    'Meriam yang masih terlihat di kawasan benteng Buton.',
    ['Foto memperlihatkan meriam di Baluarana Jaraijo dalam kawasan Benteng Keraton Buton. Benda ini dikenalkan sebagai peninggalan pertahanan, bukan sebagai senjata busana adat.', 'Dokumentasi Marwan Mohamad pada 2017 mengajak pengunjung mengamati bentuk meriam dan hubungannya dengan bangunan benteng.']),
  entry('buton-benteng', 'Benteng Wolio', 'Arsitektur & sejarah', 'buton-benteng', 'Benteng_Wolio.jpg', 'Pemerintah Indonesia / dokumentasi Kementerian Pendidikan dan Kebudayaan',
    'Benteng Keraton Buton di Kota Baubau.',
    ['Benteng Wolio juga dikenal sebagai Benteng Keraton Buton. Kawasan bersejarah ini berada di Kota Baubau dan berhubungan dengan warisan pusat pemerintahan Buton.', 'Foto dokumentasi pemerintah menampilkan bagian bangunan benteng. Susunan batu menjadi unsur yang dapat diamati dalam peninggalan arsitektur ini.'], true),
  entry('buton-popaua', 'Batu Popaua', 'Adat & sejarah', 'buton-popaua', 'Batu_Popaua.jpg', 'Marwan Mohamad / Wikimedia Commons',
    'Batu yang dikaitkan dengan pengambilan sumpah penguasa Buton.',
    ['Batu Popaua merupakan batu alam berlubang yang disakralkan dalam tradisi pengambilan sumpah raja atau sultan Buton.', 'Foto Marwan Mohamad mendokumentasikan peninggalan tersebut pada 2017. Keterangan ini membahas fungsi adat yang tercatat, tanpa menambahkan kisah atau makna simbolis yang belum terverifikasi.']),
  entry('buton-batu-wolio', 'Batu Wolio', 'Warisan budaya', 'buton-batu-wolio', 'Batu_Wolio.jpg', 'Marwan Mohamad / Wikimedia Commons',
    'Peninggalan yang disakralkan di lingkungan Keraton Buton.',
    ['Batu Wolio berada dalam kawasan Benteng Keraton Buton di Baubau. Dokumentasi fotografer menyebutnya sebagai batu yang disakralkan.', 'Foto ini memperlihatkan bentuk dan tempatnya sebagai bagian dari warisan budaya Wolio. Batu Wolio dan Batu Popaua ditampilkan sebagai dua peninggalan yang berbeda.']),
];
