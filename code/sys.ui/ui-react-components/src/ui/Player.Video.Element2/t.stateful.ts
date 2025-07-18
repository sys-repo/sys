import { type t } from './common.ts';

type P = Pick<
  t.VideoElement2Props,
  | 'src'
  | 'playing'
  | 'muted'
  | 'loop'
  | 'autoPlay'
  | 'aspectRatio'
  | 'cornerRadius'
  | 'scale'
  | 'fadeMask'
  | 'showControls'
  | 'showFullscreenButton'
  | 'showVolumeControl'
  //
  | 'jumpTo'
  //
  | 'onPlayingChange'
  | 'onMutedChange'
  | 'onEnded'
>;

/**
 * State hook:
 */
export type UsePlayerSignals = (
  signals?: t.VideoPlayerSignals,
  options?: { log?: boolean },
) => PlayerSignalsHook;
/** Instance of a stateful player hook. */
export type PlayerSignalsHook = Readonly<{ props: P }>;
