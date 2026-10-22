/* Global player-facing copy for the Sultra Rupa edition of the game shell. */
(() => {
  const title = 'Sultra Rupa | Jelajah Budaya Sulawesi Tenggara';
  const description = 'Jelajahi rumah adat, tari, musik, dan cerita masyarakat Sulawesi Tenggara dalam pengalaman 3D Sultra Rupa.';
  const legacyHost = /(?:coastalworld|coastalbank)\.com/i;
  const SULTRA_INTRO_DIALOG = {
    __first__: 'Start',
    Start: {
      isSpeak: true,
      id: 'Start',
      next: [{ action: 'GOTO', node: 'Welcome' }],
      before: [{ action: 'EMOTE', opts: ['Hello'] }],
      bubbles: ['Selamat datang di <strong>Sultra Rupa</strong>.'],
    },
    Welcome: {
      isSpeak: true,
      id: 'Welcome',
      next: [{ action: 'GOTO', node: 'Explore' }],
      before: [{ action: 'EMOTE', opts: ['Happy'] }],
      bubbles: ['Kita akan berlayar menuju pulau budaya Sulawesi Tenggara.'],
    },
    Explore: {
      isSpeak: true,
      id: 'Explore',
      next: [{ action: 'END' }],
      before: [{ action: 'EMOTE', opts: ['Gain'] }],
      bubbles: ['Saat tiba, jelajahi rumah adat, tari, musik Lulo, dan cerita lokal.'],
    },
  };
  const SULTRA_QUESTS = {
    SultraRumah: {
      id: 'SultraRumah', type: 'Main', icon: 'interactions-compass', item: null,
      title: 'Jelajah rumah adat',
      description: 'Kunjungi 4 rumah adat<br>di pulau budaya.',
      unlockText: null, unlockCondition: '',
      reward: 40, rewardItem: null,
      rewardText: '<strong>Hebat!</strong> Empat rumah adat sudah kamu kunjungi. Pemandu budaya menanti ceritanya.',
      rewardCondition: '(($sultraHouseMask & 1) ? 1 : 0) + (($sultraHouseMask & 2) ? 1 : 0) + (($sultraHouseMask & 4) ? 1 : 0) + (($sultraHouseMask & 8) ? 1 : 0) [===] 4',
    },
    SultraPemandu: {
      id: 'SultraPemandu', type: 'Main', icon: 'interactions-chat', item: null,
      title: 'Temui pemandu',
      description: 'Temui 6 pemandu<br>di titik budaya.',
      unlockText: null, unlockCondition: '',
      reward: 60, rewardItem: null,
      rewardText: '<strong>Mantap!</strong> Semua pemandu budaya sudah kamu temui. Dengarkan cerita mereka.',
      rewardCondition: '(($sultraGuideMask & 1) ? 1 : 0) + (($sultraGuideMask & 2) ? 1 : 0) + (($sultraGuideMask & 4) ? 1 : 0) + (($sultraGuideMask & 8) ? 1 : 0) + (($sultraGuideMask & 16) ? 1 : 0) + (($sultraGuideMask & 32) ? 1 : 0) [===] 6',
    },
    SultraLulo: {
      id: 'SultraLulo', type: 'Main', icon: 'interactions-tamtam', item: null,
      title: 'Tari Lulo',
      description: 'Saksikan tari Lulo<br>di panggung.',
      unlockText: null, unlockCondition: '',
      reward: 30, rewardItem: null,
      rewardText: '<strong>Indah!</strong> Kamu sudah menyaksikan tari Lulo bersama para penari.',
      rewardCondition: '$isSultraLuloWatched [===] 1',
    },
    SultraTugu: {
      id: 'SultraTugu', type: 'Side', icon: 'interactions-flag', item: null,
      title: 'Tugu MTQ',
      description: 'Kunjungi Tugu MTQ<br>di tepi pantai.',
      unlockText: null, unlockCondition: '',
      reward: 20, rewardItem: null,
      rewardText: 'Tugu MTQ sudah kamu kunjungi.',
      rewardCondition: '$isSultraTuguVisited [===] 1',
    },
    SultraOputa: {
      id: 'SultraOputa', type: 'Side', icon: 'misc-star', item: null,
      title: 'Patung Oputa',
      description: 'Kunjungi Patung<br>Oputa di pulau.',
      unlockText: null, unlockCondition: '',
      reward: 20, rewardItem: null,
      rewardText: 'Patung Oputa sudah kamu kunjungi.',
      rewardCondition: '$isSultraOputaVisited [===] 1',
    },
    SultraCerita: {
      id: 'SultraCerita', type: 'Side', icon: 'interactions-telescope', item: null,
      title: 'Cerita rumah',
      description: 'Baca cerita rumah<br>hingga bagian akhir.',
      unlockText: null, unlockCondition: '',
      reward: 30, rewardItem: null,
      rewardText: 'Satu cerita rumah sudah kamu baca sampai selesai.',
      rewardCondition: '$isSultraStoryFinished [===] 1',
    },
    SultraBusana: {
      id: 'SultraBusana', type: 'Side', icon: 'item-Body-UrbanBackpack', item: null,
      title: 'Busana budaya',
      description: 'Kenakan busana atau<br>aksesori pilihanmu.',
      unlockText: null, unlockCondition: '',
      reward: 20, rewardItem: null,
      rewardText: 'Busana budaya sudah kamu kenakan. Buka menu Atur Karakter untuk mencoba yang lain.',
      rewardCondition: '$isSultraDressedUp [===] 1',
    },
    SultraFinale: {
      id: 'SultraFinale', type: 'Main', icon: 'misc-star', item: null,
      title: 'Jelajah Sultra Rupa',
      description: 'Selesaikan semua<br>misi budaya.',
      unlockText: 'Selesaikan semua misi budaya',
      unlockCondition: '$$quests.SultraRumah && $$quests.SultraPemandu && $$quests.SultraLulo && $$quests.SultraTugu && $$quests.SultraOputa && $$quests.SultraCerita && $$quests.SultraBusana',
      reward: 0, rewardItem: 'Head-VahineCrown',
      rewardText: '<strong>Selamat!</strong> Seluruh misi budaya selesai. Mahkota bunga Vahine menjadi milikmu.',
      rewardCondition: '$$quests.SultraRumah && $$quests.SultraPemandu && $$quests.SultraLulo && $$quests.SultraTugu && $$quests.SultraOputa && $$quests.SultraCerita && $$quests.SultraBusana',
    },
  };
  const SHELL_STYLES = `
    .app-header .logo .sultra-wordmark { width: 100%; height: 100%; color: #fff; }
    .menu .menu-infos > .sultra-wordmark { color: #3b3777; }
    .menu .menu-infos .menu-cta.button,
    .start-login, .start-desc,
    .notification.hint-register,
    .page-customize .color-picker,
    .color-picker[data-v-ad64405c],
    .form-container, .form-overlay { display: none !important; }
  `;

  function installStyles() {
    if (document.head.querySelector('style[data-sultra-shell-copy]')) return;
    const style = document.createElement('style');
    style.dataset.sultraShellCopy = '';
    style.textContent = SHELL_STYLES;
    document.head.append(style);
  }

  function openCulturePhone() {
    const game = window.__sultraMobileControls?.game;
    const app = game?.app;
    if (!app?.$router || !app?.$store) return false;
    const tab = app.$store.phone?.tab;
    if (tab) {
      tab.id = 'Fintechs';
      tab.props = null;
    }
    app.$store.isMenuOpen = false;
    game.audio?.playSound?.('sfx_phone_click_medium');
    app.$router.push({ name: 'Phone' });
    return true;
  }

  function closeSaveForm() {
    const app = window.__sultraMobileControls?.game?.app;
    if (app?.$store?.isFormOpen) app.$store.isFormOpen = false;
  }

  function bindShellActions() {
    if (window.__sultraShellActions) return;
    window.__sultraShellActions = true;
    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (target.closest('.menu-infos .menu-cta.a')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openCulturePhone();
        return;
      }
      if (target.closest('.start-login, .menu-infos .menu-cta.button, .notification.hint-register')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeSaveForm();
      }
    }, true);
  }

  function installIntroDialogCopy() {
    if (window.__sultraIntroDialogCopy || typeof window.fetch !== 'function') return;
    window.__sultraIntroDialogCopy = true;
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const response = await nativeFetch(...args);
      const request = args[0];
      const url = typeof request === 'string' || request instanceof URL ? String(request) : request?.url || '';
      try {
        if (/\/dialogs_en\.json(?:[?#]|$)/i.test(url)) {
          const dialogs = await response.clone().json();
          dialogs.Intro = SULTRA_INTRO_DIALOG;
          const headers = new Headers(response.headers);
          headers.delete('content-length');
          return new Response(JSON.stringify(dialogs), {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        }
        if (/\/quests_[a-z-]+\.json(?:[?#]|$)/i.test(url)) {
          const headers = new Headers(response.headers);
          headers.delete('content-length');
          return new Response(JSON.stringify(SULTRA_QUESTS), {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        }
      } catch {
        return response;
      }
      return response;
    };
  }

  function applyData() {
    const data = window.__DATA;
    if (!data?.site) return;
    data.project ??= {};
    data.project.url = window.location.origin;
    data.project.origin = window.location.origin;

    const site = data.site;
    site.meta = { title, description };
    site.oldbrowser = {
      title: 'Perangkat belum didukung',
      description: 'Perbarui peramban atau gunakan perangkat lain untuk menjelajahi Sultra Rupa.',
    };
    site.cookies = {
      description: 'Pengaturan lokal membantu Sultra Rupa berjalan dengan baik di perangkatmu.',
      button: { accept: 'Mengerti', discard: 'Tutup' },
    };
    site.global = {
      descriptionA: 'Sultra Rupa adalah ruang jelajah budaya Sulawesi Tenggara.',
      descriptionB: 'Kenali rumah adat, tari, musik, dan cerita masyarakatnya.',
      baseline: 'Ruang jelajah budaya<br>Sulawesi Tenggara.',
      rotation: 'Putar perangkat untuk pengalaman yang lebih nyaman.',
      disclosure: 'Konten Sultra Rupa disajikan sebagai ruang belajar budaya. Sumber bacaan tersedia pada setiap cerita.',
    };
    site.home = { description: 'Lanjutkan perjalananmu?', button: { login: 'lanjutkan jelajah' } };
    site.form = {
      login: 'Lanjutkan perjalanan Sultra Rupa',
      older: 'Apakah kamu berusia 13 tahun atau lebih?',
      placeholder: 'masukkan e-mail',
      subscribe: { title: 'Simpan perjalanan', text: 'untuk melanjutkan jelajah dari perangkat lain' },
      interested: 'Tertarik?<br>Kami akan menghubungimu melalui e-mail.',
      success: { login: 'Berhasil!', message: 'E-mail sudah dikirim.' },
      adult: { error: 'Maaf, perjalanan hanya dapat disimpan untuk usia 13 tahun ke atas.' },
    };
    site.tutorial = {
      desktop: {
        world: 'Gunakan tombol atau <strong>klik dan geser untuk bergerak</strong>.',
        game: 'Gunakan tombol kiri dan kanan <strong>untuk mengarahkan kendaraan</strong>.',
      },
      mobile: {
        world: 'Geser <strong>untuk bergerak</strong>.',
        game: 'Gunakan tombol kiri dan kanan <strong>untuk mengarahkan kendaraan</strong>.',
      },
    };
    site.hint = {
      customize: { title: 'Atur karaktermu', description: 'Tekan di sini untuk mengubah tampilan karakter.' },
      quest: { title: 'Cerita baru tersedia', description: 'Tekan di sini untuk melihat perjalanan yang bisa dijelajahi.' },
      accessories: { title: 'Busana baru tersedia', description: 'Gunakan poinmu untuk membeli busana dan aksesori karakter.' },
      map: { title: '', description: 'Buka peta untuk melihat tempat budaya di pulau.' },
      fintech: { title: 'Mulai dari sini', description: 'Buka Jelajahi Budaya untuk menemukan rumah, pemandu, dan panggung Lulo.' },
      register: { title: 'Simpan perjalananmu', description: 'Buat akun untuk menyimpan progres jelajah.' },
      custompath: { title: '', description: '<strong>Perhatikan penanda di pulau</strong> untuk menemukan cerita budaya.' },
    };
    site.cta = {
      no: { thanks: 'Tidak, terima kasih' }, more: 'Selengkapnya', quest: 'Mulai cerita', about: 'Tentang',
      collect: 'Ambil', continue: 'Lanjut', customize: 'Atur', validate: 'Konfirmasi', claim: 'Klaim',
      buy: 'Beli', start: 'Mulai jelajah', drive: 'Arahkan ke sana', boat: 'Naik kapal',
      discover: 'Pelajari', login: 'Simpan perjalanan', logout: 'Keluar', reload: 'Muat ulang',
      interaction: { click: 'Klik dan tahan', touch: 'Sentuh dan tahan', tap: 'Ketuk' },
      visit: 'Kunjungi', shop: 'Lihat busana',
    };
    site.quest = {
      end: { title: 'Perjalanan selesai' }, completed: 'Cerita yang sudah dijelajahi',
      locked: 'Cerita yang akan dibuka', progress: 'Terus jelajahi!',
    };
    site.phone = {
      title: { fintech: 'Jelajahi Budaya', cp: 'Poin & Busana', customize: 'Atur Karakter', quest: 'Perjalanan' },
      desc: {
        fintech: '<strong>Temukan rumah adat, tradisi, pemandu, dan panggung Lulo di pulau.</strong>',
        cp: '<strong>Kumpulkan poin dari aktivitas dan misi, lalu gunakan untuk membeli busana dan aksesori karakter.</strong>',
        customize: '<strong>Atur wajah, busana, dan aksesori karaktermu dengan menggeser pilihan yang tersedia.</strong>',
        quest: '<strong>Ikuti cerita untuk menemukan lebih banyak budaya Sulawesi Tenggara.</strong>',
      },
      new: { item: 'baru' },
    };
    site.menu = {
      privacy: 'Tentang Sultra Rupa', privacylink: '#', terms: 'Catatan penggunaan', termslink: '#',
      cookies: 'Pengaturan lokal', cookieslink: '#', credits: 'Sultra Rupa | Jelajah Budaya Sulawesi Tenggara', coastallink: '#',
    };
    site.game = {
      timer: { timetobeat: 'Waktu terbaik', besttime: 'Waktu terbaikmu', seconds: 'detik', target: data.site.game?.timer?.target || {} },
      finish: 'selesai', results: { cta: { reward: 'Ambil hasil', quit: 'Keluar', replay: 'Ulangi' } },
    };
    site.errors = {
      outdatedWindow: { title: 'Ups!', desc: 'Permainan ini sedang dibuka dari tab lain. Muat ulang untuk melanjutkan.' },
      expiredSessionToken: { title: 'Sesi berakhir', desc: 'Sesi sudah berakhir. Gunakan tautan masuk untuk melanjutkan perjalanan.' },
      existingUser: { title: 'E-mail terkirim', desc: 'Tautan masuk sudah dikirim. Gunakan tautan itu untuk melanjutkan perjalanan.', continue: 'Lanjut sebagai tamu' },
      invalidAccessToken: { title: 'Ups!', desc: 'Tautan masuk tidak valid atau sudah berakhir. Coba masuk kembali.', continue: 'Lanjut sebagai tamu' },
    };
    site.arialabel = {
      customize: 'Atur karakter', menu: 'Buka menu', close: 'Tutup', sound: 'Suara', open: 'Buka',
      previous: 'Sebelumnya', next: 'Berikutnya', random: 'Acak', discard: 'Batalkan', validate: 'Konfirmasi',
      play: 'Putar', link: 'Buka tautan', back: 'Kembali', enter: 'Masuk', phone: 'Buka HP',
      color: 'Ganti warna', faceMale: 'Wajah laki-laki', faceFemale: 'Wajah perempuan',
    };
    data.page ??= {};
    data.page.route ??= {};
    data.page.route.url = window.location.href;
  }

  function setMeta(selector, value) {
    const node = document.head.querySelector(selector);
    if (node && node.getAttribute('content') !== value) node.setAttribute('content', value);
  }

  function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node && node.textContent !== value) node.textContent = value;
  }

  function replaceWordmarks() {
    // Replace the actual SVG artwork in its native slot, retaining dimensions
    // and animation. The loading SVG is written directly into the HTML.
    for (const logo of document.querySelectorAll('.app-header .logo, .menu .menu-infos > svg:not(.sultra-wordmark)')) {
      if (logo.hasAttribute('data-sultra-wordmark')) continue;
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      // Keep the original component's scoped sizing and transition selectors.
      for (const attribute of logo.attributes) {
        if (attribute.name.startsWith('data-v-')) svg.setAttribute(attribute.name, attribute.value);
      }
      svg.setAttribute('viewBox', '0 0 352 170');
      svg.setAttribute('class', 'sultra-wordmark');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'Sultra Rupa');
      const use = document.createElementNS(ns, 'use');
      use.setAttribute('href', '/branding/sultra-rupa.svg#wordmark');
      svg.append(use);
      if (logo.tagName.toLowerCase() === 'svg') {
        svg.dataset.sultraWordmark = '';
        logo.replaceWith(svg);
      } else {
        logo.dataset.sultraWordmark = '';
        logo.replaceChildren(svg);
      }
    }
  }

  function localizeDocument() {
    installStyles();
    closeSaveForm();
    replaceWordmarks();
    document.documentElement.lang = 'id';
    if (document.title !== title) document.title = title;
    setMeta('meta[name="title"]', title);
    setMeta('meta[name="description"]', description);
    setMeta('meta[name="application-name"]', title);
    setMeta('meta[name="apple-mobile-web-app-title"]', title);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:locale"]', 'id_ID');
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
    setText('#preloader .default', 'Sultra Rupa: Jelajah Budaya Sulawesi Tenggara');
    setText('#preloader .colored', 'Kenali rumah adat, tari, musik, dan cerita lokal.');
    setText('.ot-sdk-show-settings', 'Pengaturan cookie');
    const phoneNavLabels = {
      Map: 'Peta pulau',
      Fintechs: 'Jelajahi Budaya',
      Accessories: 'Poin dan busana',
      Customization: 'Atur karakter dan busana',
      Quests: 'Perjalanan budaya',
    };
    for (const item of document.querySelectorAll('.phone-navigation [data-tab]')) {
      const label = phoneNavLabels[item.dataset.tab];
      if (!label) continue;
      item.setAttribute('aria-label', label);
      item.setAttribute('title', label);
    }
    for (const icon of document.querySelectorAll('img[alt="Coastal Points"]')) {
      icon.alt = 'Poin';
    }
    for (const link of document.querySelectorAll('a[href]')) {
      if (legacyHost.test(link.href)) {
        link.removeAttribute('href');
        link.setAttribute('aria-disabled', 'true');
      }
    }
  }

  installIntroDialogCopy();
  applyData();
  bindShellActions();
  localizeDocument();
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      localizeDocument();
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
