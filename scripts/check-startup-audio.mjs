import assert from 'node:assert/strict';
import { installSultraStartup } from '../public/assets/sultra-startup.js';

let begin, reveal;
const calls = [];
const nativePreload = function(id) { calls.push(id); return Promise.resolve(id); };
const playSound = () => 'native-on-demand';
const game = {
  hooks: { beforePreload: { watchOnce: callback => { begin = callback; } } },
  app: { $preloader: { hidden: false, hiddenPromise: new Promise(resolve => { reveal = resolve; }) } },
  audio: { preloadSound: nativePreload, playSound },
};
installSultraStartup(game);
begin();
await game.audio.preloadSound('sfx_UI_dialog_next');
const music = game.audio.preloadSound('music_intro');
assert.deepEqual(calls, []);
reveal();
assert.equal(await music, 'music_intro');
assert.deepEqual(calls, ['music_intro']);
assert.equal(game.audio.preloadSound, nativePreload);
assert.equal(game.audio.playSound, playSound);
await game.audio.preloadSound('sfx_UI_dialog_next');
assert.deepEqual(calls, ['music_intro', 'sfx_UI_dialog_next']);
console.log('Unused audio warmup skipped; active music promise and native on-demand playback preserved.');
