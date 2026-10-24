// Register native TalkingCitizen conversations. The engine owns Space/chat,
// camera focus, gestures, movement pausing, and returning to the walking view.
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function storyBubbles(paragraph) {
  // Short bubbles also fit the native portrait/mobile dialog layout. Keep every
  // sentence from the same cultural descriptions used in the phone directory.
  const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [paragraph];
  return sentences.flatMap((sentence) => {
    const pieces = [];
    let piece = '';
    for (const word of sentence.trim().split(/\s+/)) {
      if (piece && piece.length + word.length + 1 > 200) {
        pieces.push(piece);
        piece = '';
      }
      piece += `${piece ? ' ' : ''}${word}`;
    }
    if (piece) pieces.push(piece);
    return pieces;
  });
}

export function registerSultraGuideDialog(game, subtype, content, progress = {}) {
  const subject = content.title.split(':')[0];
  const region = content.region.replace(/\s*·\s*/g, ', ');
  const bubbles = [
    `Halo! Mari mengenal <strong>${escapeHTML(subject)}</strong> dari ${escapeHTML(region)}.`,
    ...(content.visitingRegion ? storyBubbles(content.visitingRegion).map(escapeHTML) : []),
    ...content.description.flatMap(storyBubbles).map(escapeHTML),
    'Terima kasih sudah mendengarkan! Cerita lengkap dan sumber bacaan tersedia di menu <strong>Jelajahi Budaya</strong> pada ponsel.',
  ];
  const dialog = {};
  for (const [index, bubble] of bubbles.entries()) {
    const id = index === 0 ? 'Start' : `Story${index}`;
    const last = index === bubbles.length - 1;
    const node = dialog[id] = {
      id, isSpeak: true, bubble,
      next: last ? [{ action: 'END' }] : [{ action: 'GOTO', node: `Story${index + 1}` }],
    };
    if (index === 0 || index === 1 || last) {
      node.before = [{ action: 'EMOTE', opts: [index === 0 ? 'Hello' : last ? 'Happy' : 'Eloquant'] }];
    }
  }
  // Native dialogs are registered after the JSON loader's preprocessing pass.
  // It requires these hidden metadata fields when starting a conversation.
  Object.defineProperties(dialog, {
    __first__: { value: 'Start' },
    __id__: { value: subtype },
  });
  game.app.$dialogs.list[subtype] = dialog;
  const dialogs = game.app.$dialogs;
  if (!game.sultraConversationCompletions) {
    game.sultraConversationCompletions = new Map();
    const nextNode = dialogs.nextNode;
    dialogs.nextNode = async function (...args) {
      const completion = game.sultraConversationCompletions.get(dialogs.current.id);
      if (completion) completion.finishing = dialogs.current.node?.id === completion.lastNode;
      try { return await nextNode.apply(this, args); }
      finally { if (completion) completion.finishing = false; }
    };
    const startDialog = dialogs.startDialog;
    dialogs.startDialog = function (speaker, requested, options = {}) {
      const id = typeof requested === 'object' ? requested.__id__ : requested;
      const completion = game.sultraConversationCompletions.get(id);
      if (!completion) return startDialog.call(this, speaker, requested, options);
      return startDialog.call(this, speaker, requested, {
        ...options,
        onDone(current, choices) {
          // Only the final spoken node's END counts. Cancel, proximity, and
          // opening a phone article never award conversation progress.
          if (completion.finishing && current.speaker?.uid === speaker?.uid) completion.finish();
          options.onDone?.(current, choices);
        },
      });
    };
  }
  game.sultraConversationCompletions.set(subtype, {
    lastNode: `Story${bubbles.length - 1}`,
    finish() {
      const vars = game.savestate.game.vars;
      if (progress.guideBit) game.savestate.setVariable('sultraGuideTalkMask', (Number(vars.sultraGuideTalkMask) || 0) | progress.guideBit);
      if (content.id === 'lulo') game.savestate.setVariable('isSultraLuloDiscussed', true);
      if (progress.monumentId === 'tugu-mtq') game.savestate.setVariable('isSultraTuguDiscussed', true);
      if (progress.monumentId === 'patung-oputa') game.savestate.setVariable('isSultraOputaDiscussed', true);
    },
  });
  return dialog;
}
