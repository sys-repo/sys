import type { t } from './common.ts';

export type UseVideoDecksControls = (props: {
  decks: t.VideoDecks;
  active?: t.VideoDecksActive;
}) => UseVideoDecksControlsResult;

export type UseVideoDecksControlsResult = {
  readonly currentTime: t.Secs;
  readonly handleClick: t.PlayerControlsButtonHandler;
  readonly handleSeeking: t.PlayerControlSeekChangeHandler;
};
