// Penempatan rumah dan pemandu merupakan interpretasi untuk ruang belajar bersama,
// bukan peta lokasi geografis. Asal budaya dicantumkan pada setiap entri.

const architectureSource = {
  title: 'Badan Bahasa — Arsitektur Benteng dan Rumah',
  url: 'https://repositori.kemendikdasmen.go.id/10664/1/Arsitektur%20Benteng%20dan%20Rumah-Kasdar-November.pdf',
};

export const HOUSE_EXHIBITS = [
  {
    id: 'laika',
    title: 'Rumah Adat Laika',
    region: 'Tolaki · Konawe',
    subtitle: 'Rumah, alam, dan kehidupan bersama',
    description: [
      'Laika adalah rumah tradisional masyarakat Tolaki. Bentuk panggungnya memperlihatkan hubungan antara tempat tinggal, lingkungan, dan kegiatan sehari-hari. Kolong dapat digunakan untuk menyimpan alat pertanian, memelihara ternak, atau beristirahat, sekaligus membantu aliran udara di bawah lantai.',
      'Bagian hunian di atasnya menjadi ruang aktivitas keluarga. Dalam arsitektur Tolaki, bagian rumah juga dijelaskan melalui perumpamaan tubuh manusia. Laika memiliki beberapa bentuk; Laika Mbuu dan Laika Aha, misalnya, mempunyai perbedaan dalam pembagian ruangnya.',
    ],
    facts: [
      'Rumah panggung dalam kebudayaan Tolaki.',
      'Kolong memiliki beragam fungsi sehari-hari.',
      'Bentuk dan pembagian ruang berbeda menurut jenis Laika.',
    ],
    image: '/images/culture/laika.jpg',
    model: '/models/culture/laika.glb',
    sources: [
      architectureSource,
      {
        title: 'Universitas Hasanuddin — Penelitian fungsi, ruang, bentuk, dan makna Laika',
        url: 'https://repository.unhas.ac.id/8908/2/D042171004_tesis%201-2.pdf',
      },
    ],
  },
  {
    id: 'bharugano-wuna',
    title: 'Bharugano Wuna',
    region: 'Muna · Raha',
    subtitle: 'Ruang untuk merawat ingatan Muna',
    description: [
      'Bharugano Wuna menjadi tempat mengenal warisan masyarakat Muna. Rumah Adat Muna yang digunakan sebagai museum ini dibangun dan diresmikan pada 2017, kemudian memperoleh dasar pengelolaan museum pada 2018.',
      'Koleksinya mempertemukan pengunjung dengan benda keseharian, kerajinan, dan peninggalan sejarah. Keranjang, tikar, serta alat penangkap ikan membantu menceritakan kehidupan masyarakat Muna. Salah satu koleksi unggulannya adalah Kaghati Kolope, layang-layang berbahan daun. Rumah dan koleksinya menjadi ruang pembelajaran budaya yang terus dirawat.',
    ],
    facts: [
      'Bangunan Rumah Adat Muna diresmikan pada 2017.',
      'Dikelola sebagai Museum Bharugano Wuna dan taman budaya.',
      'Kaghati Kolope termasuk koleksi unggulan museum.',
    ],
    image: '/images/culture/bharugano-wuna.jpg',
    model: '/models/culture/bharugano-wuna.glb',
    sources: [
      {
        title: 'Kementerian Kebudayaan — Profil UPTD Museum Bharugano Wuna',
        url: 'https://museum.kemenbud.go.id/museum/profile/uptd%2Bmuseum%2Bbharugano%2Bwuna?page=11',
      },
      {
        title: 'Kementerian Pendidikan dan Kebudayaan — Katalog Museum Indonesia',
        url: 'https://repositori.kemendikdasmen.go.id/26873/1/Katalog%20museum%20NAsional%20Jilid%202.pdf',
      },
    ],
  },
  {
    id: 'banua-tada',
    title: 'Banua Tada',
    region: 'Buton · Wolio',
    subtitle: 'Rumah siku, cerita masyarakat Buton',
    description: [
      'Banua Tada merupakan rumah tradisional dalam kebudayaan Buton, khususnya masyarakat Wolio. Namanya berarti rumah siku, merujuk pada bentuk siku dalam rangka bangunannya. Rumah panggung ini menggunakan kayu sebagai struktur utama.',
      'Bentuk dan ukurannya berkaitan dengan kedudukan penghuninya. Kamali atau Malige dikenal sebagai kediaman raja atau sultan beserta keluarganya, sementara bentuk lain digunakan oleh pejabat dan masyarakat. Ragam Banua Tada memperlihatkan bagaimana arsitektur menyimpan cerita tentang kehidupan sosial dan sejarah Buton.',
    ],
    facts: [
      'Banua berarti rumah; tada berarti siku.',
      'Berasal dari lingkungan budaya Buton/Wolio.',
      'Kamali atau Malige merupakan bentuk kediaman raja atau sultan.',
    ],
    image: '/images/culture/banua-tada.png',
    model: '/models/culture/banua-tada.glb',
    sources: [
      {
        title: 'Kementerian Pariwisata — Arsitektur Tradisional Banua Tada',
        url: 'https://www.indonesia.travel/id/id/travel-ideas/heritage/banua-tada-traditional-house',
      },
      {
        title: 'Badan Bahasa — Berselancar ke 34 Rumah Adat, halaman 81',
        url: 'https://badanbahasa.kemendikdasmen.go.id/resource/doc/files/14._Isi_dan_Sampul_Berselancar_ke_34_Rumah_Adat.pdf',
      },
    ],
  },
  {
    id: 'mekongga',
    title: 'Rumah Adat Mekongga',
    region: 'Tolaki Mekongga · Kolaka',
    subtitle: 'Jejak kepemimpinan dan ragam hias pakis',
    description: [
      'Rumah Adat Mekongga di Kolaka menghadirkan kembali bentuk kediaman yang dikaitkan dengan Bokeo Latambaga. Bangunan yang dikenal sekarang merupakan hasil pembangunan kembali, dengan ornamen yang membawa nilai budaya setempat.',
      'Salah satu ragam hiasnya adalah tabere, yang mengambil bentuk tumbuhan pakis. Ornamen ini menghubungkan rumah dengan gagasan tentang kehidupan dan keberlanjutan generasi. Pada dindingnya terlihat warna kuning, hitam, dan merah. Rumah ini mengenalkan sejarah kepemimpinan dan ruang pertemuan dalam masyarakat Mekongga.',
    ],
    facts: [
      'Berkaitan dengan warisan Bokeo Latambaga di Kolaka.',
      'Ragam hias tabere mengambil bentuk pakis.',
      'Warna hias yang dikenal meliputi kuning, hitam, dan merah.',
    ],
    image: '/images/culture/mekongga.jpg',
    model: '/models/culture/mekongga.glb',
    sources: [
      {
        title: 'KPPN Kolaka — Kunjungan dan Penjelasan Rumah Adat Mekongga',
        url: 'https://djpb.kemenkeu.go.id/kppn/kolaka/id/data-publikasi/berita-terbaru/3017-pelaksanaan-kegiatan-dialog-sejarah-kolaka-raya-dan-wawasan-kebangsaan.html',
      },
      architectureSource,
    ],
  },
];

export const CULTURE_GUIDES = [
  {
    id: 'lulo',
    title: 'Lulo: Langkah dalam Lingkaran',
    region: 'Tolaki · Konawe dan Mekongga',
    subtitle: 'Gerak bersama, irama, dan persaudaraan',
    homeId: 'mekongga',
    description: [
      'Lulo atau Molulo dikenal melalui gerak bersama dalam lingkaran. Para peserta bergandengan tangan dan menyelaraskan langkah mengikuti irama. Dalam kehidupan masyarakat Tolaki, pertemuan seperti ini menjadi ruang untuk mempererat hubungan dan menyambut orang lain.',
      'Geraknya mengingatkan kita untuk memperhatikan orang di sebelah kita. Bentuk pertunjukan dan iringannya dapat berkembang, sementara lingkaran tetap menjadi ciri yang mudah dikenali.',
    ],
    facts: [
      'Penari bergandengan tangan dalam formasi melingkar.',
      'Gerakan tangan dan kaki dilakukan bersama mengikuti irama.',
      'Menjadi bagian dari pertemuan sosial masyarakat Tolaki.',
    ],
    sources: [
      {
        title: 'IAIN Parepare — Penelitian Tradisi Lulo di Kolaka Utara',
        url: 'https://repository.iainpare.ac.id/id/eprint/2011/1/15.1400.003.pdf',
      },
      {
        title: 'Universitas Negeri Makassar — Makna Formasi Melingkar Molulo',
        url: 'https://ojs.unm.ac.id/pakarena/article/download/35992/17474',
      },
    ],
  },
  {
    id: 'lumense',
    title: 'Lumense: Harapan dari Kabaena',
    region: 'Moronene · Kabaena, Bombana',
    subtitle: 'Tarian harapan dari Kabaena',
    homeId: 'laika',
    visitingRegion: 'Pemandu tamu dari Kabaena; Lumense merupakan tradisi Moronene.',
    description: [
      'Lumense berasal dari masyarakat Moronene di Pulau Kabaena. Tarian ini mempunyai hubungan dengan tradisi memohon keselamatan dan menjauhkan bencana. Salah satu bagian yang dikenal adalah gerak menebas batang pisang sebagai lambang mengakhiri malapetaka.',
      'Dalam perkembangannya, Lumense juga ditampilkan untuk menyambut tamu. Pertunjukan ini menyimpan ingatan tentang kepercayaan, harapan, dan perjalanan masyarakat pendukungnya.',
    ],
    facts: [
      'Berasal dari Moronene di Pulau Kabaena.',
      'Batang pisang hadir sebagai simbol dalam pertunjukan.',
      'Memiliki sejarah ritual dan berkembang menjadi penyambutan tamu.',
    ],
    sources: [
      {
        title: 'Direktorat Warisan dan Diplomasi Budaya — Tarian dari Negeri Awan',
        url: 'https://kebudayaan.kemdikbud.go.id/ditwdb/tarian-dari-negeri-awan/',
      },
      {
        title: 'Badan Bahasa — Legenda Tari Lumense',
        url: 'https://repositori.kemendikdasmen.go.id/33219/',
      },
    ],
  },
  {
    id: 'pomani',
    title: 'Pomani: Mengenal Tari Muna',
    region: 'Muna',
    subtitle: 'Keindahan budaya masyarakat Muna',
    homeId: 'bharugano-wuna',
    description: [
      'Pomani memperkenalkan keindahan budaya masyarakat Muna melalui seni tari. Nama ini tercatat dalam Kamus Budaya Sulawesi Tenggara yang diterbitkan Badan Bahasa.',
      'Masyarakat Muna memiliki beragam tradisi pertunjukan, dan setiap nama perlu dikenali dalam konteksnya sendiri. Mengenal Pomani dapat dimulai dengan mendengarkan pengetahuan para penari dan pelaku tradisi yang merawat serta meneruskannya.',
    ],
    facts: [
      'Pomani berkaitan dengan budaya masyarakat Muna.',
      'Dijelaskan sebagai tarian yang menggambarkan keindahan budaya Muna.',
    ],
    sources: [
      {
        title: 'Badan Bahasa — Kamus Budaya Sulawesi Tenggara, halaman 104',
        url: 'https://repositori.kemendikdasmen.go.id/2893/1/Kamus%20Budaya%20Sulawesi%20Tenggara%20%20-%20%20137a.pdf',
      },
    ],
  },
  {
    id: 'alionda',
    title: 'Alionda: Tari, Nyanyian, dan Permainan',
    region: 'Kulisusu · Buton Utara',
    subtitle: 'Tari, nyanyian, dan permainan rakyat',
    homeId: 'banua-tada',
    visitingRegion: 'Pemandu dari Kulisusu, Buton Utara, mengenalkan tradisinya di ruang bersama.',
    description: [
      'Alionda adalah pertunjukan tradisi masyarakat Kulisusu di Buton Utara. Di dalamnya bertemu tari, nyanyian, dan permainan rakyat. Pengetahuan pertunjukan diwariskan melalui keluarga serta keterlibatan langsung dalam pementasan.',
      'Penelitian tentang Alionda mencatat penciptaan nyanyian secara spontan tanpa teks tertulis. Tradisi ini menunjukkan bahwa belajar budaya juga berlangsung dengan mendengar, mengamati, dan ikut berkegiatan bersama pelaku tradisi.',
    ],
    facts: [
      'Berasal dari masyarakat Kulisusu di Buton Utara.',
      'Memadukan tari, nyanyian, dan permainan rakyat.',
      'Diwariskan melalui keluarga dan kegiatan pertunjukan.',
    ],
    sources: [
      {
        title: 'Universitas Indonesia — Penelitian Alionda oleh Fina Amalia Masri',
        url: 'https://lib.ui.ac.id/detail?id=20297338&lokasi=lokal',
      },
    ],
  },
  {
    id: 'kaghati-kolope',
    title: 'Kaghati Kolope: Daun yang Terbang',
    region: 'Muna · Liangkobori',
    subtitle: 'Layang-layang daun dari Muna',
    homeId: 'bharugano-wuna',
    description: [
      'Kaghati Kolope adalah layang-layang tradisional masyarakat Muna yang menggunakan daun kolope atau daun ubi hutan. Bambu menjadi bagian rangkanya, sementara serat nanas hutan digunakan untuk tali.',
      'Membuatnya mempertemukan keterampilan tangan dengan pengetahuan tentang bahan di lingkungan sekitar. Di Desa Wisata Liangkobori, pengunjung dapat mengenal proses pembuatannya bersama pemandu. Perhatikan bagaimana daun dan serat tumbuhan disusun menjadi benda yang dapat terbang.',
    ],
    facts: [
      'Daun kolope menjadi bahan badan layang-layang.',
      'Rangka menggunakan bambu; tali menggunakan serat nanas hutan.',
      'Keterampilan pembuatannya dapat dipelajari di Liangkobori.',
    ],
    sources: [
      {
        title: 'Jadesta Kementerian Pariwisata — Kaghati Kolope di Liangkobori',
        url: 'https://jadesta.kemenpar.go.id/paket/kaghati_kolope_layanglayang_purba',
      },
    ],
  },
  {
    id: 'tenun-konawe',
    title: 'Tenun Konawe: Cerita dalam Benang',
    region: 'Konawe',
    subtitle: 'Motif, benang, dan ketekunan perajin',
    homeId: 'laika',
    description: [
      'Tenun Konawe menyimpan pengetahuan tentang benang, alat, dan pembentukan motif. Penenun menggunakan gedogan maupun alat tenun bukan mesin, yang dikenal sebagai ATBM. Keduanya membutuhkan keterampilan dalam mengatur benang hingga menjadi kain.',
      'Tradisi tenun di wilayah ini juga memperlihatkan hubungan dengan masyarakat Buton dan Bugis. Sehelai kain menjadi pintu untuk mengenal pertemuan budaya serta ketekunan para perajin.',
    ],
    facts: [
      'Gedogan dan ATBM digunakan dalam kegiatan menenun.',
      'Anggopiu dikenal sebagai salah satu sentra perajin tenun Konawe.',
      'Perkembangannya berkaitan dengan pengaruh Buton dan Bugis.',
    ],
    sources: [
      {
        title: 'Balai Pelestarian Nilai Budaya — Tenun Tradisional Konawe',
        url: 'https://kebudayaan.kemdikbud.go.id/bpnbsulsel/tenun-tradisional-konawe/',
      },
    ],
  },
];
