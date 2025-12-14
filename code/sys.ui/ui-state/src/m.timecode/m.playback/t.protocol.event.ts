import type { t } from './common.ts';

/**
 * Playback event protocol (observable outputs).
 *
 * Events announce what the machine has *decided* or *detected*,
 * without influencing future state evolution.
 */
export type PlaybackEvent =
  | { readonly kind: 'timecode:ready' }
  | { readonly kind: 'playback:phase'; readonly phase: t.PlaybackPhase }
  | { readonly kind: 'playback:beat'; readonly beat: t.PlaybackBeatIndex }
  | {
      readonly kind: 'playback:deck:status';
      readonly deck: t.PlaybackDeckId;
      readonly status: t.PlaybackDeckStatus;
    }
  | { readonly kind: 'playback:error'; readonly message: string };
