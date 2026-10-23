// Keep the house API synchronous for interaction code, and load the renderer,
// controls, stylesheet and HD room only when a visitor enters a house.
export function createLazyHouseInterior(game, options) {
  let interior, pending, disposed = false, opening = false, generation = 0;
  let notice;
  function clearNotice() { notice?.remove(); notice = undefined; }
  function showNotice(text) {
    clearNotice();
    notice = document.createElement('p');
    notice.setAttribute('role', 'status');
    notice.textContent = text;
    notice.style.cssText = 'position:fixed;z-index:100;bottom:12%;left:10%;width:80%;text-align:center;font:16px system-ui;color:white;text-shadow:0 1px 4px black;pointer-events:none';
    document.body.append(notice);
  }
  function load() {
    pending ??= Promise.all([import('./sultra-house-interior.js'), loadStyles()]).then(([{ createHouseInterior }]) => {
      if (disposed) return;
      interior = createHouseInterior(game, options);
      return interior;
    }).catch(error => { pending = undefined; throw error; });
    return pending;
  }
  function loadStyles() {
    const existing = document.querySelector('link[data-sultra-interior]');
    if (existing?.sheet) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const link = existing || document.createElement('link');
      link.rel = 'stylesheet';
      link.href = new URL('./sultra-interior.css', import.meta.url).href;
      link.dataset.sultraInterior = '';
      link.addEventListener('load', resolve, { once: true });
      link.addEventListener('error', () => {
        link.remove();
        reject(new Error('Interior stylesheet unavailable'));
      }, { once: true });
      if (!existing) document.head.append(link);
    });
  }
  return {
    get isOpen() { return opening || Boolean(interior?.isOpen); },
    get status() { return opening ? 'loading' : interior?.status ?? 'closed'; },
    get target() { return interior?.target; },
    async open(target) {
      if (disposed) return;
      const current = ++generation;
      opening = true;
      if (!interior) showNotice('Memuat ruangan…');
      try {
        const room = interior || await load();
        if (current !== generation || disposed) return;
        clearNotice();
        room.open(target);
      } catch (error) {
        if (current === generation) {
          showNotice('Ruangan belum berhasil dimuat. Ketuk rumah untuk mencoba lagi.');
          console.error('[Sultra interior]', error);
        }
      } finally {
        if (current === generation) opening = false;
      }
    },
    preload: () => load().then(room => room?.preload()),
    close(settings) {
      generation++;
      opening = false;
      clearNotice();
      interior?.close(settings);
    },
    destroy() {
      disposed = true;
      this.close({ reason: 'destroy', restoreFocus: false });
      interior?.destroy();
    },
  };
}
