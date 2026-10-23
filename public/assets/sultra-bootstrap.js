// Preserve localization/manifest overrides before the engine creates its app.
import './sultra-shell-copy.js';

let aboutLoading;
window.addEventListener('click', (event) => {
  if (window.__sultraAbout) return;
  const link = event.target instanceof Element ? event.target.closest('.menu-footer a') : null;
  if (link?.textContent.trim() !== 'Tentang Sultra Rupa') return;
  event.preventDefault();
  event.stopImmediatePropagation();
  link.setAttribute('aria-busy', 'true');
  aboutLoading ??= import('./sultra-about.js').catch((error) => {
    aboutLoading = undefined;
    throw error;
  });
  aboutLoading.then(() => window.__sultraAbout.open()).catch((error) => {
    console.error('[Sultra About]', error);
    window.alert('Halaman Tentang belum berhasil dimuat. Silakan coba lagi.');
  }).finally(() => link.removeAttribute('aria-busy'));
}, true);

function stylesheetReady(link) {
  if (link.dataset.failed) return Promise.reject(new Error(`Stylesheet unavailable: ${link.href}`));
  if (link.sheet) return Promise.resolve();
  return new Promise((resolve, reject) => {
    link.addEventListener('load', resolve, { once: true });
    link.addEventListener('error', () => reject(new Error(`Stylesheet unavailable: ${link.href}`)), { once: true });
  });
}

Promise.all([...document.querySelectorAll('link[data-game-style]')].map(stylesheetReady))
  .then(() => import('./main.35e6243a65453426.js'))
  .catch((error) => {
    console.error('[Sultra startup]', error);
    const status = document.createElement('button');
    status.textContent = 'Pemuatan gagal. Ketuk untuk mencoba lagi.';
    status.style.cssText = 'position:fixed;z-index:30;bottom:15%;left:10%;width:80%;padding:16px;pointer-events:auto';
    status.addEventListener('click', () => location.reload());
    document.body.append(status);
  });
