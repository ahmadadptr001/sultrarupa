import narrationManifest from './sultra-narration-manifest.js';

const MAX_CHUNK_LENGTH = 220;
const LISTEN_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor"/></svg>';
const STOP_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2.5" fill="currentColor"/></svg>';

function narrationChunks(target) {
  const list = (value) => Array.isArray(value) ? value : value ? [value] : [];
  const paragraphs = list(target?.description)
    .filter((value) => typeof value === 'string' && value.trim());
  const chunks = [];
  for (const paragraph of paragraphs) {
    const text = paragraph.replace(/[·•]/g, ',').replace(/\s+/g, ' ').trim();
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    for (const sentence of sentences) {
      let chunk = '';
      for (const word of sentence.trim().split(/\s+/)) {
        if (chunk && chunk.length + word.length + 1 > MAX_CHUNK_LENGTH) {
          chunks.push(chunk);
          chunk = '';
        }
        chunk += `${chunk ? ' ' : ''}${word}`;
      }
      if (chunk) chunks.push(chunk);
    }
  }
  return chunks;
}

/** Narration stays with the active exhibit and honours the game's audio switch. */
export function createCultureVoice(game, { onStateChange = () => {} } = {}) {
  const synth = window.speechSynthesis;
  const speechSupported = !!(synth && window.SpeechSynthesisUtterance);
  const audioSupported = typeof window.Audio === 'function';
  const supported = audioSupported || speechSupported;
  const element = document.createElement('div');
  element.className = 'sultra-culture-voice';
  element.hidden = true;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sultra-culture-voice-button';
  const buttonIcon = document.createElement('span');
  buttonIcon.className = 'sultra-culture-voice-icon';
  buttonIcon.setAttribute('aria-hidden', 'true');
  buttonIcon.innerHTML = LISTEN_ICON;
  const buttonLabel = document.createElement('span');
  buttonLabel.className = 'sultra-culture-voice-label';
  button.append(buttonIcon, buttonLabel);
  const status = document.createElement('p');
  status.className = 'sultra-culture-voice-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  element.append(button, status);

  let target = null, chunks = [], chunkIndex = 0;
  let speaking = false, destroyed = false, generation = 0;
  let currentUtterance = null, currentAudio = null, startTimeout = null;
  let lastMuted = muted();

  function muted() {
    const store = game?.app?.$store;
    return !!(store?.isAudioMuted || store?.isVideoPlaying);
  }

  function voice() {
    if (!speechSupported) return null;
    // Some browsers populate voices only after the first call to getVoices().
    const voices = synth.getVoices();
    const indonesian = voices.filter((entry) => /^(id|in)(?:[-_]|$)/i.test(entry.lang));
    return indonesian.find((entry) => entry.localService) || indonesian[0] || null;
  }

  function recording() {
    const id = target?.id === 'lulo-stage' ? 'lulo' : target?.id;
    const entry = id ? narrationManifest[id] : null;
    // A missing page falls back to that page's text, never the full recording.
    if (Number.isInteger(target?.narrationPage)) return entry?.pages?.[target.narrationPage] || null;
    return entry;
  }

  function releaseAudio() {
    const audio = currentAudio;
    currentAudio = null;
    if (!audio) return;
    audio.onplaying = audio.onended = audio.onerror = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }

  function render(message = '') {
    element.hidden = !target;
    const label = speaking ? 'Hentikan narasi' : 'Dengarkan narasi';
    buttonLabel.textContent = speaking ? 'Hentikan narasi' : 'Dengarkan';
    button.setAttribute('aria-label', label);
    button.title = label;
    buttonIcon.innerHTML = speaking ? STOP_ICON : LISTEN_ICON;
    button.setAttribute('aria-pressed', String(speaking));
    button.disabled = !supported || !target || !chunks.length || muted();
    status.textContent = !supported
      ? 'Narasi suara belum didukung di peramban ini.'
      : muted() && target
        ? 'Nyalakan suara untuk mendengar narasi.'
        : message;
    onStateChange({ speaking, target, supported });
  }

  function stop(message = '') {
    generation++;
    window.clearTimeout(startTimeout);
    startTimeout = null;
    const hadUtterance = !!currentUtterance;
    currentUtterance = null;
    speaking = false;
    chunkIndex = 0;
    // Cancel only our active narration; closing an unopened exhibit is a no-op.
    if (speechSupported && hadUtterance) synth.cancel();
    releaseAudio();
    render(message);
  }

  function speakNext(token) {
    if (destroyed || token !== generation || !speaking) return;
    if (muted() || document.hidden) { stop(); return; }
    if (chunkIndex >= chunks.length) {
      currentUtterance = null;
      speaking = false;
      render('Narasi selesai.');
      return;
    }
    // Never let a foreign/default voice read Indonesian with the wrong accent.
    const selectedVoice = voice();
    if (!selectedVoice) {
      stop('Narasi belum tersedia. Tekan tombol suara untuk mencoba lagi.');
      return;
    }
    const utterance = new window.SpeechSynthesisUtterance(chunks[chunkIndex]);
    utterance.lang = 'id-ID';
    utterance.rate = 1.08;
    utterance.pitch = 1;
    utterance.volume = .9;
    utterance.voice = selectedVoice;
    // Keep a reference until end/error so long descriptions are not collected.
    currentUtterance = utterance;
    utterance.onstart = () => {
      if (token !== generation) return;
      window.clearTimeout(startTimeout);
      startTimeout = null;
      render('Narasi bahasa Indonesia.');
    };
    utterance.onend = () => {
      if (token !== generation) return;
      window.clearTimeout(startTimeout);
      startTimeout = null;
      currentUtterance = null;
      chunkIndex++;
      speakNext(token);
    };
    utterance.onerror = (event) => {
      if (token !== generation) return;
      const message = event.error === 'not-allowed'
        ? 'Tekan tombol suara untuk memulai narasi.'
        : ['voice-unavailable', 'language-unavailable', 'synthesis-unavailable'].includes(event.error)
          ? 'Suara belum tersedia di perangkat ini. Informasi tetap dapat dibaca.'
          : ['canceled', 'interrupted'].includes(event.error)
            ? '' : 'Narasi belum dapat diputar. Tekan tombol suara untuk mencoba lagi.';
      stop(message);
    };
    startTimeout = window.setTimeout(() => {
      if (token === generation && currentUtterance === utterance) {
        stop('Suara belum tersedia. Tekan tombol suara untuk mencoba lagi.');
      }
    }, 8000);
    try {
      if (synth.paused) synth.resume();
      synth.speak(utterance);
    } catch {
      stop('Narasi belum dapat diputar di perangkat ini.');
    }
  }

  function playRecording(token, entry) {
    const audio = new window.Audio();
    currentAudio = audio;
    audio.preload = 'none';
    audio.volume = .9;
    const active = () => !destroyed && token === generation && currentAudio === audio;
    const fallback = () => {
      if (!active()) return;
      window.clearTimeout(startTimeout);
      startTimeout = null;
      releaseAudio();
      if (voice()) speakNext(token);
      else stop('Narasi belum dapat dimuat. Tekan tombol suara untuk mencoba lagi.');
    };
    audio.onplaying = () => {
      if (!active()) return;
      window.clearTimeout(startTimeout);
      startTimeout = null;
      render('Narasi bahasa Indonesia.');
    };
    audio.onended = () => {
      if (!active()) return;
      window.clearTimeout(startTimeout);
      startTimeout = null;
      releaseAudio();
      speaking = false;
      render('Narasi selesai.');
    };
    audio.onerror = fallback;
    startTimeout = window.setTimeout(fallback, 15000);
    audio.src = entry.url;
    try {
      const promise = audio.play();
      promise?.catch((error) => {
        if (!active()) return;
        if (error.name === 'NotAllowedError') stop('Tekan tombol suara untuk memulai narasi.');
        else fallback();
      });
    } catch {
      fallback();
    }
  }

  function play() {
    if (destroyed || !target || !chunks.length) return false;
    stop();
    if (!supported || muted() || document.hidden) return false;
    speaking = true;
    render('Menyiapkan narasi…');
    const entry = recording();
    if (audioSupported && entry?.url) playRecording(generation, entry);
    else speakNext(generation);
    return true;
  }

  function setTarget(nextTarget, { autoplay = true } = {}) {
    if (destroyed) return;
    stop();
    target = nextTarget || null;
    chunks = narrationChunks(target);
    render();
    if (target && autoplay) play();
  }

  function clear() {
    stop();
    target = null;
    chunks = [];
    render();
  }

  function onClick(event) {
    event.stopPropagation();
    if (speaking) stop('Narasi dihentikan.');
    else play();
  }

  function onVisibility() {
    if (document.hidden && speaking) stop('Tekan tombol suara untuk memulai lagi.');
  }

  function onVoicesChanged() {
    if (!speechSupported || destroyed) return;
    if (target && !speaking && voice()) render();
  }

  function checkMute() {
    const nextMuted = muted();
    if (nextMuted === lastMuted) return;
    lastMuted = nextMuted;
    if (nextMuted && speaking) stop();
    else render();
  }

  button.addEventListener('click', onClick);
  document.addEventListener('visibilitychange', onVisibility);
  synth?.addEventListener('voiceschanged', onVoicesChanged);
  const muteInterval = window.setInterval(checkMute, 200);
  render();

  return {
    element, setTarget, clear, play, stop,
    get isSpeaking() { return speaking; },
    get currentTarget() { return target; },
    destroy() {
      if (destroyed) return;
      clear();
      destroyed = true;
      window.clearInterval(muteInterval);
      button.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVisibility);
      synth?.removeEventListener('voiceschanged', onVoicesChanged);
      element.remove();
    },
  };
}
