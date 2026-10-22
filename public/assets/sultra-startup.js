const installed = new WeakSet();

export function installSultraStartup(game) {
  if (installed.has(game)) return;
  installed.add(game);

  // Audio exists after init; this hook runs before native resources and scenes
  // start their optional sound preloads. Neither caller waits for those files.
  game.hooks.beforePreload.watchOnce(() => {
    const preloader = game.app.$preloader;
    if (preloader.hidden) return;
    const audio = game.audio;
    const preloadSound = audio.preloadSound;
    const ready = preloader.hiddenPromise.then(() => new Promise((resolve) => {
      // Let the revealed scene paint before audio competes for bandwidth.
      setTimeout(resolve, 100);
    })).then(() => {
      if (audio.preloadSound === deferredPreload) audio.preloadSound = preloadSound;
    });

    function deferredPreload(...args) {
      // Preserve the native promise so BGM begins once its buffer is ready.
      // Interactive sounds retain their native on-demand loading path.
      return ready.then(() => preloadSound.apply(this, args));
    }

    audio.preloadSound = deferredPreload;
  });
}
