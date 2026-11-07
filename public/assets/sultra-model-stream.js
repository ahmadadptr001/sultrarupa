// Bounded parallel HD downloads. Nearby destinations take priority; completed models
// stay in the scene/template cache. Failed requests can be retried without reload.
export function createModelStream(sites, load, { radius = 95, concurrency = 2, connection = globalThis.navigator?.connection } = {}) {
  const entries = new Map(sites.map(site => [site.id, { site, status: 'idle', retryAt: 0 }]));
  let active = 0, nextCheck = 0;
  const limit = () => connection?.saveData || /(^|-)2g$|3g/.test(connection?.effectiveType || '')
    ? 1 : Math.max(1, Math.min(2, concurrency));
  const queue = [];
  function pump() {
    // A requested destination can use a second slot even while a background
    // model is in flight. Never create an unbounded download burst.
    while (queue.length && active < (queue[0].urgent ? 2 : limit())) {
      const entry = queue.shift();
      active++;
      entry.status = 'loading';
      Promise.resolve().then(() => load(entry.site.id)).then(() => {
        entry.status = 'ready';
        entry.resolve();
      }, error => {
        entry.status = 'error';
        entry.error = error;
        entry.retryAt = performance.now() + 30000;
        entry.reject(error);
      }).finally(() => { active--; pump(); });
    }
  }
  function request(id, urgent = false) {
    const entry = entries.get(id);
    if (!entry) return Promise.resolve();
    if (entry.status === 'ready' || entry.status === 'loading') return entry.promise;
    if (entry.status === 'queued') {
      if (urgent) { entry.urgent = true; queue.splice(queue.indexOf(entry), 1); queue.unshift(entry); pump(); }
      return entry.promise;
    }
    entry.promise = new Promise((resolve, reject) => { entry.resolve = resolve; entry.reject = reject; });
    entry.status = 'queued';
    entry.urgent = urgent;
    if (urgent) queue.unshift(entry); else queue.push(entry);
    pump();
    return entry.promise;
  }
  function nearest(x, z) {
    return [...entries.values()].map(entry => ({ entry, distance: Math.hypot(entry.site.x - x, entry.site.z - z) }))
      .sort((a, b) => a.distance - b.distance);
  }
  return {
    entries,
    request,
    initial(x, z) { return request(nearest(x, z)[0]?.entry.site.id, true); },
    update(x, z, now = performance.now()) {
      if (now < nextCheck) return;
      nextCheck = now + 500;
      // Select fresh nearby candidates only when capacity is available; don't
      // accumulate downloads for destinations the player has already left.
      const available = limit() - active;
      if (available <= 0 || queue.length) return;
      const candidates = nearest(x, z).filter(({ entry, distance }) => distance <= radius
        && (entry.status === 'idle' || (entry.status === 'error' && now >= entry.retryAt)));
      for (const { entry } of candidates.slice(0, available)) {
        request(entry.site.id).catch(error => console.warn('[Sultra model stream]', entry.site.id, error));
      }
    },
  };
}
