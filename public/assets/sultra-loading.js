// The original counter advanced by 1% per rendered frame, even after the
// downloads had finished. On a slow device this added tens of seconds.
// Keep the native task/prerender barrier, show real progress, then reveal once.
export function createSultraPreloader(app, element) {
  const counter = element.querySelector('.preloader-counter');
  let progress = -1;
  let stalled;
  let failed = false;
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.style.cssText = 'position:absolute;bottom:8%;left:5%;width:90%;text-align:center;font:14px/1.5 system-ui;color:inherit';
  const message = document.createElement('span');
  const retry = document.createElement('button');
  retry.textContent = 'Coba lagi';
  retry.style.cssText = 'display:block;margin:10px auto;padding:8px 18px;border:1px solid currentColor;border-radius:20px;background:transparent;color:inherit;cursor:pointer;font:inherit';
  retry.addEventListener('click', () => window.location.reload());
  status.append(message, retry);
  status.hidden = true;
  function reportWait() {
    message.textContent = navigator.onLine
      ? 'Masih memuat aset HD. Jika tidak berlanjut, coba muat ulang.'
      : 'Koneksi terputus. Sambungkan internet lalu coba lagi.';
    status.hidden = false;
  }
  function resetWait() {
    clearTimeout(stalled);
    if (failed) return;
    status.hidden = true;
    stalled = setTimeout(reportWait, 30000);
  }
  function reportError() {
    failed = true;
    clearTimeout(stalled);
    message.textContent = 'Game belum berhasil dimuat. Periksa koneksi lalu coba lagi.';
    status.hidden = false;
  }
  function cleanup() {
    clearTimeout(stalled);
    window.removeEventListener('offline', reportWait);
    window.removeEventListener('online', resetWait);
    window.removeEventListener('sultra:loading-error', reportError);
  }
  return {
    enter() {
      element.append(status);
      window.addEventListener('offline', reportWait);
      window.addEventListener('online', resetWait);
      window.addEventListener('sultra:loading-error', reportError);
      resetWait();
      element.querySelector('.waves')?.remove();
      element.setAttribute('aria-label', 'Memuat Sultra Rupa');
      counter?.setAttribute('role', 'progressbar');
      counter?.setAttribute('aria-label', 'Kemajuan pemuatan');
      counter?.setAttribute('aria-valuemin', '0');
      counter?.setAttribute('aria-valuemax', '100');
    },
    onProgress(value) {
      const next = Math.min(99, Math.floor(Math.max(0, value) * 100));
      if (next === progress || !counter) return;
      progress = next;
      resetWait();
      counter.textContent = String(next).padStart(2, '0');
      counter.setAttribute('aria-valuenow', String(next));
    },
    async exit(reveal) {
      cleanup();
      status.hidden = true;
      if (counter) {
        counter.textContent = '100';
        counter.setAttribute('aria-valuenow', '100');
      }
      // Called only after the engine has loaded and prerendered the scene.
      const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180;
      element.style.transition = `opacity ${duration}ms ease-out`;
      element.style.opacity = '0';
      reveal();
      if (duration) await new Promise(resolve => setTimeout(resolve, duration));
    },
    beforeDestroy: cleanup,
  };
}

export function configureSultraLoading(app) {
  // These SDKs use the original Coastal World account, not Sultra Rupa.
  // Avoid its consent widget, analytics, ad pixels and their startup requests.
  app.$analytics.disable();
  app.$onetrust.init = () => {};
  document.documentElement.classList.add('sultra-local-storage');
}
