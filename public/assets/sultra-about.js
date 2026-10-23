/* About Sultra Rupa dialog with placeholder team profiles. */
(() => {
  const TEAM = [
    {
      name: 'Ahmad Bagas A.',
      role: 'Full-Stack Developer',
      bio: 'Membangun arsitektur dan menyatukan pengalaman 3D dengan web.',
      photo: '/branding/team/ahmad-bagas.webp',
      crop: 'bagas',
    },
    {
      name: 'Aditya P Aryandi Ramadhan',
      role: 'Front-End Developer',
      bio: 'Merapikan antarmuka, interaksi, dan performa agar pulau tetap ringan di semua perangkat.',
      photo: '/branding/team/aditya.webp',
      crop: 'aditya',
    },
    {
      name: 'Ahmad Dino',
      role: 'UI/UX Designer',
      bio: 'Merancang alur, tipografi, dan detail visual yang membuat cerita budaya mudah dijelajahi.',
      photo: '/branding/team/ahmad-dino.webp',
      crop: 'dino',
    },
  ];

  const STYLES = `
    html.sultra-about-open,
    html.sultra-about-open body { overflow: hidden !important; }
    /* Some engines intersect touch-action across the full ancestor chain, so the
       body-level touch-action:none from the game must be released while open or
       the dialog cannot pan on touch devices. */
    html.sultra-about-open body { touch-action: pan-y; }
    .sultra-about { position: fixed; inset: 0; z-index: 1200; display: grid; place-items: center; padding: 24px; font-family: Gilmer, "Avenir Next", "Segoe UI", sans-serif; color: #26233f; touch-action: pan-y; overscroll-behavior: contain; }
    .sultra-about[hidden] { display: none !important; }
    .sultra-about__backdrop { position: absolute; inset: 0; background: rgb(28 24 52 / 62%); backdrop-filter: blur(6px); animation: sultra-about-fade .22s ease-out both; }
    .sultra-about__dialog { position: relative; width: min(880px, 100%); max-height: min(90vh, 900px); overflow: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; background: #fbfaf7; border-radius: 30px; box-shadow: 0 30px 90px rgb(18 15 35 / 35%); animation: sultra-about-rise .28s cubic-bezier(.2,.8,.2,1) both; cursor: grab; touch-action: pan-y; scrollbar-width: none; -ms-overflow-style: none; }
    .sultra-about__dialog::-webkit-scrollbar { display: none; }
    .sultra-about__dialog.is-dragging { cursor: grabbing; }
    .sultra-about__dialog.is-dragging, .sultra-about__dialog.is-dragging * { user-select: none; }
    .sultra-about__dialog a, .sultra-about__dialog button { cursor: pointer; }
    .sultra-about__close { position: absolute; top: 20px; right: 20px; z-index: 3; display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; border-radius: 50%; background: rgb(255 255 255 / 16%); color: #fff; cursor: pointer; transition: background .2s ease, transform .2s ease; }
    .sultra-about__close:hover { background: rgb(255 255 255 / 28%); transform: rotate(4deg); }
    .sultra-about__close:focus-visible { outline: 3px solid #f6d35f; outline-offset: 3px; }
    .sultra-about__close svg { width: 20px; height: 20px; }
    .sultra-about__hero { position: relative; overflow: hidden; padding: 44px 46px 34px; background: linear-gradient(135deg, #332f68 0%, #4d4890 55%, #028c7a 130%); color: #fff; touch-action: pan-y; }
    .sultra-about__hero::before { content: ""; position: absolute; width: 280px; height: 280px; right: -75px; top: -120px; border: 1px solid rgb(255 255 255 / 22%); border-radius: 50%; box-shadow: 0 0 0 42px rgb(255 255 255 / 5%), 0 0 0 84px rgb(255 255 255 / 4%); }
    .sultra-about__hero::after { content: ""; position: absolute; width: 160px; height: 160px; left: -54px; bottom: -94px; border-radius: 50%; background: #02c6a7; opacity: .2; }
    .sultra-about__kicker { position: relative; z-index: 1; margin: 0 0 12px; color: #9ff1e1; font-size: 11px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
    .sultra-about__title { position: relative; z-index: 1; margin: 0; max-width: 600px; font-size: clamp(38px, 6vw, 58px); font-weight: 700; line-height: .98; letter-spacing: -.035em; }
    .sultra-about__title span { color: #f6d35f; }
    .sultra-about__lead { position: relative; z-index: 1; max-width: 610px; margin: 18px 0 0; color: rgb(255 255 255 / 82%); font-size: 14px; line-height: 1.65; }
    .sultra-about__stats { position: relative; z-index: 1; display: flex; flex-wrap: wrap; gap: 10px 28px; margin: 28px 0 0; padding: 18px 0 0; border-top: 1px solid rgb(255 255 255 / 18%); list-style: none; }
    .sultra-about__stats li { display: flex; align-items: baseline; gap: 7px; color: rgb(255 255 255 / 65%); font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
    .sultra-about__stats strong { color: #fff; font-size: 23px; line-height: 1; letter-spacing: -.04em; }
    .sultra-about__anoa { position: absolute; z-index: 1; right: 34px; bottom: 10px; width: 196px; height: auto; pointer-events: none; filter: drop-shadow(0 14px 18px rgb(15 12 36 / 22%)); }
    .sultra-about__anoa .anoa-walk { transform-origin: center bottom; animation: sultra-anoa-bob 2.6s ease-in-out infinite; }
    .sultra-about__anoa .anoa-leg { transform-box: fill-box; transform-origin: 50% 6%; animation: sultra-anoa-step .9s ease-in-out infinite alternate; }
    .sultra-about__anoa .anoa-leg--far-back,
    .sultra-about__anoa .anoa-leg--near-front { animation-delay: -.45s; }
    .sultra-about__anoa .anoa-tail { transform-box: fill-box; transform-origin: 100% 8%; animation: sultra-anoa-tail 2.2s ease-in-out infinite; }
    .sultra-about__body { padding: 34px 46px 42px; touch-action: pan-y; }
    .sultra-about__section + .sultra-about__section { margin-top: 30px; padding-top: 28px; border-top: 1px solid #e7e2d8; }
    .sultra-about__eyebrow { margin: 0 0 8px; color: #008f7c; font-size: 10px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
    .sultra-about__body h3 { margin: 0 0 12px; color: #302b5e; font-size: 21px; line-height: 1.2; letter-spacing: -.02em; }
    .sultra-about__body p { max-width: 690px; margin: 0; color: #5e5a70; font-size: 13.5px; line-height: 1.72; }
    .sultra-about__body p + p { margin-top: 10px; }
    .sultra-about__note { display: flex; gap: 14px; margin-top: 20px; padding: 16px 18px; border: 1px solid #d9efe9; border-radius: 16px; background: #effaf6; }
    .sultra-about__note svg { flex: 0 0 auto; width: 22px; height: 22px; margin-top: 1px; color: #008f7c; }
    .sultra-about__note p { color: #3f6860; font-size: 12.5px; line-height: 1.6; }
    .sultra-about__team { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
    .sultra-about__member { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; min-width: 0; padding: 17px; border: 1px solid #e8e3d9; border-radius: 18px; background: #fff; box-shadow: 0 8px 20px rgb(48 43 94 / 4%); }
    .sultra-about__photo { flex: 0 0 auto; width: 72px; height: 72px; border-radius: 50%; object-fit: cover; background: #ece9f7; box-shadow: 0 0 0 3px #f6f3ec; }
    .sultra-about__photo--crop { position: relative; display: block; overflow: hidden; }
    .sultra-about__photo--crop img { position: absolute; width: 304%; height: 405.333%; max-width: none; left: -164.444%; top: -133.333%; }
    .sultra-about__photo--aditya img { width: 290.909%; height: 387.879%; left: -100%; top: -148.485%; }
    .sultra-about__photo--dino img { width: 300%; height: 400%; left: -90.625%; top: -121.875%; }
    .sultra-about__memberText { min-width: 0; }
    .sultra-about__role { margin: 0 0 4px; color: #008f7c; font-size: 9px; font-weight: 700; letter-spacing: .1em; line-height: 1.35; text-transform: uppercase; }
    .sultra-about__name { margin: 0 0 5px; color: #302b5e; font-size: 14px; font-weight: 700; line-height: 1.2; }
    .sultra-about__bio { margin: 0; color: #706b80; font-size: 11px; line-height: 1.5; }
    .sultra-about__contact { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-top: 30px; padding-top: 22px; border-top: 1px solid #e7e2d8; }
    .sultra-about__contact p { font-size: 11.5px; }
    .sultra-about__mail { display: inline-flex; align-items: center; gap: 7px; color: #3b3777; font-size: 12px; font-weight: 700; text-decoration: none; }
    .sultra-about__mail:hover { color: #008f7c; text-decoration: underline; text-underline-offset: 3px; }
    .sultra-about__mail:focus-visible { outline: 2px solid #3b3777; outline-offset: 4px; border-radius: 4px; }
    @keyframes sultra-about-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes sultra-about-rise { from { opacity: 0; transform: translateY(16px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes sultra-anoa-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
    @keyframes sultra-anoa-step { from { transform: rotate(-7deg); } to { transform: rotate(8deg); } }
    @keyframes sultra-anoa-tail { 0%, 100% { transform: rotate(-7deg); } 50% { transform: rotate(9deg); } }
    @media (max-width: 680px) {
      .sultra-about { padding: 12px; }
      .sultra-about__dialog { max-height: 92dvh; border-radius: 24px; }
      .sultra-about__hero { padding: 34px 22px 26px; }
      .sultra-about__close { top: 12px; right: 12px; width: 40px; height: 40px; }
      .sultra-about__lead { margin-top: 14px; font-size: 13px; }
      .sultra-about__stats { gap: 10px 18px; margin-top: 22px; padding-top: 15px; }
      .sultra-about__stats strong { font-size: 19px; }
      .sultra-about__anoa { position: relative; right: auto; bottom: auto; display: block; width: 126px; margin: 12px 2px -8px auto; }
      .sultra-about__body { padding: 24px 20px 30px; }
      .sultra-about__team { grid-template-columns: 1fr; }
      .sultra-about__member { flex-direction: row; align-items: center; }
      .sultra-about__photo { width: 64px; height: 64px; }
      .sultra-about__section + .sultra-about__section { margin-top: 24px; padding-top: 22px; }
      .sultra-about__contact { align-items: flex-start; flex-direction: column; }
    }
    @media (prefers-reduced-motion: reduce) {
      .sultra-about__backdrop, .sultra-about__dialog { animation: none; }
      .sultra-about__close, .sultra-about__mail { transition: none; }
      .sultra-about__anoa .anoa-walk,
      .sultra-about__anoa .anoa-leg,
      .sultra-about__anoa .anoa-tail { animation: none; }
    }
  `;

  let dialog = null;
  let panel = null;
  let closeButton = null;
  let lastFocus = null;
  let swallowEscapeUp = false;

  function installStyles() {
    if (document.head.querySelector('style[data-sultra-about]')) return;
    const style = document.createElement('style');
    style.dataset.sultraAbout = '';
    style.textContent = STYLES;
    document.head.append(style);
  }

  function memberMarkup(member) {
    return `
      <article class="sultra-about__member">
        ${member.crop
          ? `<span class="sultra-about__photo sultra-about__photo--crop sultra-about__photo--${member.crop}"><img data-photo-src="${member.photo}" alt="Foto ${member.name}" width="684" height="912" decoding="async"></span>`
          : `<img class="sultra-about__photo" data-photo-src="${member.photo}" alt="Foto ${member.name}" width="66" height="66" decoding="async">`}
        <div class="sultra-about__memberText">
          <p class="sultra-about__role">${member.role}</p>
          <h4 class="sultra-about__name">${member.name}</h4>
          <p class="sultra-about__bio">${member.bio}</p>
        </div>
      </article>
    `;
  }

  function buildDialog() {
    if (dialog) return;
    const root = document.createElement('div');
    root.className = 'sultra-about';
    root.hidden = true;
    root.innerHTML = `
      <div class="sultra-about__backdrop" data-about-close></div>
      <div class="sultra-about__dialog" role="dialog" aria-modal="true" aria-labelledby="sultra-about-title" aria-describedby="sultra-about-lead">
        <button type="button" class="sultra-about__close" data-about-close aria-label="Tutup tentang Sultra Rupa">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
        <header class="sultra-about__hero">
          <p class="sultra-about__kicker">Di balik pulau budaya</p>
          <h2 class="sultra-about__title" id="sultra-about-title">Tentang <span>Sultra Rupa</span></h2>
          <p class="sultra-about__lead" id="sultra-about-lead">Ruang jelajah budaya tiga dimensi yang mengajak siapa pun mengenal rumah adat, tari, musik, dan cerita masyarakat Sulawesi Tenggara.</p>
          <ul class="sultra-about__stats">
            <li><strong>4</strong> rumah adat</li>
            <li><strong>6</strong> pemandu budaya</li>
            <li><strong>1</strong> pulau jelajah</li>
          </ul>
          <svg class="sultra-about__anoa" viewBox="0 0 260 180" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="anoaFur" x1=".1" y1=".05" x2=".72" y2="1">
                <stop offset="0" stop-color="#9a7159"/>
                <stop offset=".52" stop-color="#7a5548"/>
                <stop offset="1" stop-color="#563c33"/>
              </linearGradient>
            </defs>
            <circle cx="132" cy="90" r="72" fill="#f2cf7a"/>
            <circle cx="132" cy="90" r="80" stroke="#fff" stroke-opacity=".24" stroke-dasharray="2 8"/>
            <ellipse cx="131" cy="157" rx="70" ry="7" fill="#15112e" opacity=".2"/>
            <g class="anoa-walk">
              <g class="anoa-tail">
                <path d="M82 101c-10 0-18 5-23 13" stroke="#4d3832" stroke-width="5" stroke-linecap="round"/>
                <path d="M60 114c-4 3-8 4-12 2 2-5 7-8 12-8Z" fill="#4d3832"/>
              </g>
              <g class="anoa-leg anoa-leg--far-back">
                <path d="M108 120l-3 17-1 13" stroke="#513a34" stroke-width="10" stroke-linecap="round"/>
                <path d="M104 147v5" stroke="#e8d4b6" stroke-width="9" stroke-linecap="round"/>
                <path d="M103 154h10" stroke="#2b1e20" stroke-width="5" stroke-linecap="round"/>
              </g>
              <g class="anoa-leg anoa-leg--far-front">
                <path d="M175 119l2 18 2 13" stroke="#513a34" stroke-width="10" stroke-linecap="round"/>
                <path d="M179 147v5" stroke="#e8d4b6" stroke-width="9" stroke-linecap="round"/>
                <path d="M180 154h10" stroke="#2b1e20" stroke-width="5" stroke-linecap="round"/>
              </g>
              <path d="M78 112c-7-15 1-29 17-35 6-16 22-26 42-26 20 0 36 8 45 23 12 6 18 16 16 28-2 12-12 19-26 19H101c-12 0-23-6-23-16Z" fill="url(#anoaFur)" stroke="#3b2a27" stroke-width="3.5" stroke-linejoin="round"/>
              <path d="M91 101c8-12 21-19 38-20" stroke="#b58c70" stroke-width="3.5" stroke-linecap="round" opacity=".9"/>
              <path d="M177 88c8-8 19-11 30-7 13 5 20 16 19 28-1 12-10 20-23 20h-14c-11 0-19-8-19-18 0-10 3-17 7-23Z" fill="url(#anoaFur)" stroke="#3b2a27" stroke-width="3.5" stroke-linejoin="round"/>
              <path d="M184 87c9-5 20-7 29-3" stroke="#c49b7c" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>
              <path d="M196 83c-8-9-19-14-32-16 13 0 25 5 35 14l-3 2Z" fill="#f3d38d" stroke="#6f5733" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M207 82c-5-11-14-18-26-22 14 1 25 8 30 20l-4 2Z" fill="#f8dda0" stroke="#6f5733" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M184 88c-8 2-14 0-18-5 7-1 13 1 18 5Z" fill="#795548" stroke="#3b2a27" stroke-width="2" stroke-linejoin="round"/>
              <path d="M211 87c7 0 12-2 16-6-4 6-9 9-16 9Z" fill="#795548" stroke="#3b2a27" stroke-width="2" stroke-linejoin="round"/>
              <path d="M217 103c9 0 16 5 17 12 1 8-5 13-14 13h-8" fill="#987264" stroke="#3b2a27" stroke-width="3" stroke-linecap="round"/>
              <circle cx="210" cy="98" r="3.5" fill="#f7ead2"/>
              <circle cx="211" cy="98" r="1.8" fill="#2b1e20"/>
              <path d="M228 109c3 0 5 1 5 3s-2 3-5 3" fill="#21171a"/>
              <path d="M219 117c4 2 8 2 11 0" stroke="#2b1e20" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M193 121c5 3 11 3 16 0" stroke="#e8d4b6" stroke-width="4" stroke-linecap="round"/>
              <path d="M209 89c2 3 3 6 3 9" stroke="#e8d4b6" stroke-width="3" stroke-linecap="round" opacity=".8"/>
              <g class="anoa-leg anoa-leg--near-back">
                <path d="M124 122l-2 16 1 13" stroke="#62463c" stroke-width="11" stroke-linecap="round"/>
                <path d="M121 147v5" stroke="#efdcc0" stroke-width="10" stroke-linecap="round"/>
                <path d="M119 154h11" stroke="#2b1e20" stroke-width="5" stroke-linecap="round"/>
              </g>
              <g class="anoa-leg anoa-leg--near-front">
                <path d="M188 121l3 17 2 13" stroke="#62463c" stroke-width="11" stroke-linecap="round"/>
                <path d="M192 147v5" stroke="#efdcc0" stroke-width="10" stroke-linecap="round"/>
                <path d="M192 154h11" stroke="#2b1e20" stroke-width="5" stroke-linecap="round"/>
              </g>
            </g>
          </svg>
        </header>
        <div class="sultra-about__body">
          <section class="sultra-about__section">
            <p class="sultra-about__eyebrow">Misi kami</p>
            <h3>Budaya yang dekat, bukan sekadar dipamerkan</h3>
            <p>Sultra Rupa menghadirkan kekayaan budaya Sulawesi Tenggara dalam pengalaman yang bisa ditelusuri sendiri. Pengunjung diajak berjalan dari satu rumah adat ke rumah adat lain, bertemu pemandu, menyaksikan tari Lulo, dan membaca cerita yang tumbuh di setiap tempat.</p>
            <p>Kami percaya cara terbaik mengenal budaya adalah dengan meluangkan waktu di dalamnya. Karena itu, setiap sudut pulau dirancang sebagai pintu masuk kecil menuju cerita yang lebih besar.</p>
            <div class="sultra-about__note">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.4" stroke="currentColor" stroke-width="1.7"/></svg>
              <p>Dikembangkan sebagai ruang belajar yang ramah untuk pelajar, keluarga, dan siapa pun yang ingin mengenal budaya Sulawesi Tenggara.</p>
            </div>
          </section>
          <section class="sultra-about__section">
            <p class="sultra-about__eyebrow">Tim di balik layar</p>
            <h3>Tim Pengembang</h3>
            <p>Universitas Nahdlatul Ulama Sulawesi Tenggara<br>Program Studi Teknik Informatika</p>
            <div class="sultra-about__team">
              ${TEAM.map(memberMarkup).join('')}
            </div>
          </section>
          <footer class="sultra-about__contact">
            <p>Punya cerita, koreksi, atau ide untuk Sultra Rupa?</p>
            <a class="sultra-about__mail" href="mailto:halo@sultrarupa.id">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" stroke-width="1.7"/><path d="m4 7 8 6 8-6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
              halo@sultrarupa.id
            </a>
          </footer>
        </div>
      </div>
    `;
    document.body.append(root);
    dialog = root;
    panel = root.querySelector('.sultra-about__dialog');
    closeButton = root.querySelector('.sultra-about__close');
    enableDragScroll();
  }

  function enableDragScroll() {
    if (!panel || panel.dataset.dragReady) return;
    panel.dataset.dragReady = 'true';
    let drag = null;
    let suppressClick = false;

    const endDrag = () => {
      if (!drag) return;
      if (panel.hasPointerCapture?.(drag.id)) panel.releasePointerCapture(drag.id);
      panel.classList.remove('is-dragging');
      drag = null;
      suppressClick = true;
      window.setTimeout(() => { suppressClick = false; }, 80);
    };

    panel.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('a, button, input, textarea, select, [contenteditable="true"]')) return;
      if (panel.scrollHeight <= panel.clientHeight) return;
      drag = { id: event.pointerId, y: event.clientY, top: panel.scrollTop };
      panel.setPointerCapture?.(event.pointerId);
      panel.classList.add('is-dragging');
      event.preventDefault();
    });

    panel.addEventListener('pointermove', (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      panel.scrollTop = drag.top - (event.clientY - drag.y);
      event.preventDefault();
    });

    panel.addEventListener('pointerup', endDrag);
    panel.addEventListener('pointercancel', endDrag);
    panel.addEventListener('click', (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  }

  function openAbout() {
    buildDialog();
    if (!dialog.hidden) return;
    // Load every portrait on opening, even below the dialog's scroll viewport.
    // Keep these requests out of the game's initial loading path.
    for (const photo of dialog.querySelectorAll('[data-photo-src]')) {
      if (!photo.getAttribute('src') || (photo.complete && !photo.naturalWidth)) {
        photo.src = photo.dataset.photoSrc;
      }
    }
    lastFocus = document.activeElement;
    dialog.hidden = false;
    document.documentElement.classList.add('sultra-about-open');
    closeButton.focus({ preventScroll: true });
  }

  function closeAbout() {
    if (!dialog || dialog.hidden) return;
    dialog.hidden = true;
    document.documentElement.classList.remove('sultra-about-open');
    if (lastFocus instanceof HTMLElement) lastFocus.focus({ preventScroll: true });
  }

  function trapFocus(event) {
    if (!dialog || dialog.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      swallowEscapeUp = true;
      closeAbout();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')].filter((node) => !node.hasAttribute('disabled'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function bind() {
    if (window.__sultraAboutBound) return;
    window.__sultraAboutBound = true;
    window.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (target.closest('.menu-footer a')?.textContent.trim() === 'Tentang Sultra Rupa') {
        event.preventDefault();
        event.stopImmediatePropagation();
        openAbout();
        return;
      }
      if (target.closest('[data-about-close]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeAbout();
      }
    }, true);
    window.addEventListener('keydown', trapFocus, true);
    window.addEventListener('keyup', (event) => {
      if (event.key !== 'Escape' || !swallowEscapeUp) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      swallowEscapeUp = false;
    }, true);
    window.__sultraAbout = { open: openAbout, close: closeAbout };
  }

  function boot() {
    installStyles();
    buildDialog();
    bind();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();

