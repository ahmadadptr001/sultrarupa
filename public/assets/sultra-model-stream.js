// One HD model at a time. Nearby destinations take priority; completed models
// stay in the scene/template cache. Failed requests can be retried without reload.
export function createModelStream(sites, load, { radius = 95 } = {}) {
  const entries = new Map(sites.map(site => [site.id, { site, status: 'idle', retryAt: 0 }]));
  let active = false, nextCheck = 0;
  const queue = [];
  async function pump() {
    if (active || !queue.length) return;
    active = true;
    const entry = queue.shift();
    entry.status = 'loading';
    try {
      await load(entry.site.id);
      entry.status = 'ready';
      entry.resolve();
    } catch (error) {
      entry.status = 'error';
      entry.error = error;
      entry.retryAt = performance.now() + 30000;
      entry.reject(error);
    } finally {
      active = false;
      pump();
    }
  }
  function request(id, urgent = false) {
    const entry = entries.get(id);
    if (!entry) return Promise.resolve();
    if (entry.status === 'ready' || entry.status === 'loading') return entry.promise;
    if (entry.status === 'queued') {
      if (urgent) { queue.splice(queue.indexOf(entry), 1); queue.unshift(entry); }
      return entry.promise;
    }
    entry.promise = new Promise((resolve, reject) => { entry.resolve = resolve; entry.reject = reject; });
    entry.status = 'queued';
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
      // Recompute priorities as the player moves; do not drain a queue of old
      // distant destinations. At most one proximity fetch is outstanding.
      if (active || queue.length) return;
      const candidate = nearest(x, z).find(({ entry, distance }) => distance <= radius
        && entry.status !== 'ready' && (entry.status !== 'error' || now >= entry.retryAt));
      if (candidate) request(candidate.entry.site.id).catch(error => {
        console.warn('[Sultra model stream]', candidate.entry.site.id, error);
      });
    },
  };
}
