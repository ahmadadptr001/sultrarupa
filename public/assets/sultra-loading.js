// The original counter advanced by 1% per rendered frame, even after the
// downloads had finished. On a slow device this added tens of seconds.
// Keep the native task/prerender barrier, show real progress, then reveal once.
export function createSultraPreloader(app, element) {
  const counter = element.querySelector('.preloader-counter');
  let progress = -1;
  return {
    enter() {
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
      counter.textContent = String(next).padStart(2, '0');
      counter.setAttribute('aria-valuenow', String(next));
    },
    async exit(reveal) {
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
  };
}

export function configureSultraLoading(app) {
  // These SDKs use the original Coastal World account, not Sultra Rupa.
  // Avoid its consent widget, analytics, ad pixels and their startup requests.
  app.$analytics.disable();
  app.$onetrust.init = () => {};
  document.documentElement.classList.add('sultra-local-storage');
}
