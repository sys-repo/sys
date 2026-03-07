import type { t } from './common.ts';

/**
 * Hook for binding VideoDecks to Player Controls.
 */
export type UseVideoDecksControls = (props: {
  decks: t.VideoDecks;
  active?: t.VideoDecksActive;
}) => UseVideoDecksControlsResult;

export type UseVideoDecksControlsResult = {
  readonly currentTime: t.Secs;
  readonly handleClick: t.PlayerControlsButtonHandler;
  readonly handleSeeking: t.PlayerControlSeekChangeHandler;
};

/**
 * Component: PlayControls bound to VideoDecks.
 */
export type VideoDecksControlsProps = {
  decks: t.VideoDecks;
  active?: t.VideoDecksActive;
  //
  debug?: boolean;
  theme?: t.CommonTheme;
  padding?: t.CssEdgesInput;
  margin?: t.CssEdgesInput;
  background?: t.PlayerControlsBackgroundProps;
};
