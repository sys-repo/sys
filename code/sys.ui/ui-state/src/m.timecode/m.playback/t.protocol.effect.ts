import type { t } from './common.ts';

/**
 * Playback command protocol (effect intents).
 *
 * Commands are emitted by the reducer and consumed by the runner.
 * They are idempotent, order-sensitive, and side-effect free by design.
 */
export type PlaybackCmd =
  | { readonly kind: 'cmd:noop' }
  | { readonly kind: 'cmd:emit-ready' }
  | {
      readonly kind: 'cmd:deck:load';
      readonly deck: t.PlaybackDeckId;
      readonly beat: t.PlaybackBeatIndex;
    }
  | { readonly kind: 'cmd:deck:play'; readonly deck: t.PlaybackDeckId }
  | { readonly kind: 'cmd:deck:pause'; readonly deck: t.PlaybackDeckId }
  | PlaybackCmdDeckSeek
  | { readonly kind: 'cmd:swap-decks' };

/**
 * Seek using GLOBAL virtual timeline time (vTime).
 * Runner maps vTime → deck-local media time (e.g. subtract segment base).
 */
export type PlaybackCmdDeckSeek = {
  readonly kind: 'cmd:deck:seek';
  readonly deck: t.PlaybackDeckId;
  readonly vTime: t.Msecs;
};
