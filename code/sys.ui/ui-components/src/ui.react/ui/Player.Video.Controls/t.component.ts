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
  buffered?: t.Secs;
  buffering?: boolean;

  // Appearance:
  padding?: t.CssPaddingInput;
  margin?: t.CssMarginInput;
  maskHeight?: t.Percent;
  maskOpacity?: t.Pixels;
  background?: PlayerControlsBackgroundProps;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onClick?: t.PlayerControlsButtonHandler;
  onSeeking?: t.PlayerControlSeekChangeHandler;
};

/** Background for the player-controls panel. */
export type PlayerControlsBackgroundProps = {
  rounded?: t.Pixels;
  opacity?: t.Percent;
  blur?: t.Pixels;
  shadow?: boolean;
};

/**
 * Events:
 */
export type PlayerControlsButtonHandler = (e: PlayerControlsButtonHandlerArgs) => void;
/** Player control button click payload. */
export type PlayerControlsButtonHandlerArgs = { readonly button: PlayerControlButton };

/** Player seek change handler. */
export type PlayerControlSeekChangeHandler = (e: PlayerControlSeekChange) => void;
/** Player seek change payload. */
export type PlayerControlSeekChange = Readonly<{
  currentTime: t.Secs;
  duration: t.Secs;
  percent: t.Percent;
  complete: boolean;
}>;
