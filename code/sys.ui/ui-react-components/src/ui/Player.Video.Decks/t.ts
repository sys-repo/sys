import type { t } from './common.ts';

/** Type re-exports */
export type * from './t.controls.ts';

/**
 * Renders A/B video decks.
 */
export type VideoDecksLib = {
  readonly create: (opts?: { cornerRadius?: t.Pixels }) => t.VideoDecks;
  readonly UI: t.FC<VideoDecksProps>;
  readonly Controls: {
    readonly UI: t.FC<t.VideoDecksControlsProps>;
    readonly useDecksControls: t.UseVideoDecksControls;
  };
};

export type VideoDecksActive = 'A' | 'B';
export type VideoDecksShow = 'both' | 'single';

/**
 * Component:
 */
export type VideoDecksProps = {
  decks?: t.TimecodePlaybackDriver.VideoDecks;
  active?: VideoDecksActive;
  aspectRatio?: t.VideoElementProps['aspectRatio'];
  muted?: t.VideoElementProps['muted'];
  gap?: t.Pixels;
  show?: VideoDecksShow;
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
