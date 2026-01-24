import type { t } from './common.ts';

/**
 * Renders A/B video decks.
 */
export type VideoDecksLib = {
  readonly UI: t.FC<VideoDecksProps>;
  readonly create: (opts?: { cornerRadius?: t.Pixels }) => t.VideoDecks;
};

/**
 * Component:
 */
export type VideoDecksProps = {
  decks?: t.TimecodePlaybackDriver.VideoDecks;
  active?: 'A' | 'B';
  aspectRatio?: t.VideoElementProps['aspectRatio'];
  muted?: t.VideoElementProps['muted'];
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Dual video deck signals.
 */
export type VideoDecks = {
  readonly A: t.VideoPlayerSignals;
  readonly B: t.VideoPlayerSignals;
};
