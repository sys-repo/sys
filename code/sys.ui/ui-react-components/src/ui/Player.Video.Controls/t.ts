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
  enabled?: boolean;

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
export type PlayerControlsButtonHandlerArgs = { readonly button: PlayerControlButton };

export type PlayerControlSeekChangeHandler = (e: PlayerControlSeekChange) => void;
export type PlayerControlSeekChange = Readonly<{
  currentTime: t.Secs;
  duration: t.Secs;
  percent: t.Percent;
  complete: boolean;
}>;
