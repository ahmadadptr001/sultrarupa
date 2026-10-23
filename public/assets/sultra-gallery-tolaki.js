const commons = name => `https://commons.wikimedia.org/wiki/File:${name}`;
const entry = (id, title, category, file, original, author, license, summary, details) => ({
  id, title, category, culture: 'Warisan bersama masyarakat Tolaki',
  image: `/images/culture/gallery/${file}.webp`, alt: `${title}, dokumentasi masyarakat Tolaki.`, summary, details,
  sources: [{ title: `Dokumentasi ${title}`, url: commons(original) }],
  credit: { author, license: license === 'by' ? 'CC BY 4.0' : 'CC BY-SA 4.0',
    licenseUrl: `https://creativecommons.org/licenses/${license}/4.0/`, url: commons(original),
    changes: 'Ukuran diperkecil bila perlu dan dikonversi ke WebP; isi gambar tidak diubah.' },
});
export const TOLAKI_GALLERY_ADDITIONS = [
  entry('tolaki-umoara-busana', 'Busana Umoara', 'Busana & seni pertunjukan', 'tolaki-umoara-busana', 'Baju_Adat_Suku_Tolaki.jpg', 'Anonssuper / Wikimedia Commons', 'by-sa',
    'Busana yang dikenakan dalam tarian Umoara masyarakat Tolaki.',
    ['Foto Anonssuper mendokumentasikan busana Umoara pada 2015. Pakaian ini digunakan dalam penyajian tarian perang Tolaki.', 'Umoara dapat ditampilkan untuk menyambut tamu dan dalam perayaan perkawinan. Foto ini memperkenalkan busana pertunjukan, bukan satu-satunya bentuk pakaian adat Tolaki.']),
  entry('tolaki-rumah-arsip', 'Rumah Tolaki dalam Arsip', 'Rumah & sejarah', 'tolaki-rumah-arsip', 'Rumah_Adat_Tolaki.jpg', 'Perpustakaan Belanda; unggahan Febryansyah Pagala / Wikimedia Commons', 'by',
    'Dokumentasi rumah adat Tolaki yang diberi keterangan asal Konawe.',
    ['Arsip ini diberi judul Rumah Adat Tolaki dan keterangan Konawe oleh sumber dokumentasinya. Bentuk rumah dan lingkungan sekitarnya menjadi bagian dari pengamatan arsitektur masa lalu.', 'Tanggal pemindaian tidak dianggap sebagai tahun pembangunan atau pemotretan asli. Foto ini bukan dokumentasi khusus istana Mekongga.']),
  entry('tolaki-umoara-penyambutan', 'Umoara dalam Penyambutan', 'Adat & pertunjukan', 'tolaki-umoara-penyambutan', 'Baju_Adat_Suku_Tolaki_Sulawesi_Tenggara.jpg', 'Anonssuper / Wikimedia Commons', 'by-sa',
    'Dokumentasi lain busana Umoara dalam tradisi penyambutan Tolaki.',
    ['Keterangan fotografer menghubungkan busana Umoara dengan penyambutan tamu agung serta kedatangan mempelai pria dalam pernikahan masyarakat Tolaki.', 'Perhatikan kesatuan pakaian dan perlengkapan yang dikenakan dalam dokumentasi ini. Nama motif dan makna tiap warna tidak disimpulkan hanya dari foto.']),
  entry('tolaki-busana-arsip', 'Masyarakat Tolaki dalam Arsip', 'Busana & sejarah', 'tolaki-busana-arsip', 'FOTO_ORANG_TOLAKI_0023.jpg', 'Perpustakaan Belanda; unggahan Febryansyah Pagala / Wikimedia Commons', 'by',
    'Foto arsip untuk mengamati penampilan masyarakat Tolaki pada masa lalu.',
    ['Dokumentasi ini diidentifikasi sebagai foto masyarakat adat Tolaki di Sulawesi Tenggara. Busana dan perlengkapan yang terlihat merupakan bagian dari rekaman visual sejarah.', 'Nama orang, jabatan, serta tanggal pemotretan asli tidak tersedia dalam keterangan sumber. Foto tidak digunakan untuk mengklaim satu bentuk busana yang berlaku bagi seluruh masyarakat Tolaki.']),
  entry('tolaki-umoara-perlengkapan', 'Perlengkapan Penari Umoara', 'Busana & perlengkapan', 'tolaki-umoara-gerak', 'Pakean_Umoara_Suku_Tolaki.jpg', 'Anonssuper / Wikimedia Commons', 'by-sa',
    'Pakaian dan perlengkapan yang membentuk penampilan penari Umoara.',
    ['Foto ini merupakan dokumentasi tersendiri pakaian Umoara oleh Anonssuper. Pengunjung dapat membandingkan penampilan busana pertunjukan pada beberapa foto dalam galeri.', 'Koleksi Umoara ditempatkan di Laika dan Mekongga sebagai pengenalan tradisi bersama masyarakat Tolaki; dokumentasinya tidak diklaim khusus berasal dari satu kabupaten.']),
];
