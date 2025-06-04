import type { t } from './common.ts';

/** Player control flag. */
export type PlayerControlKind = PlayerControlButton | 'SeekSlider';
/** Player buttons. */
export type PlayerControlButton = 'Play' | 'Mute';

/**
 * <Component>:
 */
export type PlayerControlsProps = {
  debug?: boolean;
  playing?: boolean;
  muted?: boolean;

  currentTime?: t.Secs;
  duration?: t.Secs;
  buffering?: boolean;
  buffered?: t.Secs;

  // Appearance:
  maskHeight?: t.Percent;
  maskOpacity?: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onClick?: t.PlayerControlsButtonHandler;
  onSeeking?: t.PlayerControlSeekChangeHandler;
};

/**
 * Events:
 */
export type PlayerControlsButtonHandler = (e: PlayerControlsButtonHandlerArgs) => void;
export type PlayerControlsButtonHandlerArgs = { readonly control: PlayerControlButton };

export type PlayerControlSeekChangeHandler = (e: PlayerControlSeekChangeHandlerArgs) => void;
export type PlayerControlSeekChangeHandlerArgs = {
  readonly currentTime: t.Secs;
  readonly duration: t.Secs;
  readonly percent: t.Percent;
  readonly complete: boolean;
};
