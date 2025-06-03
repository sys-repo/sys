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

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onClick?: t.PlayerControlsButtonHandler;
};

/**
 * Events:
 */
export type PlayerControlsButtonHandler = (e: PlayerControlsButtonHandlerArgs) => void;
export type PlayerControlsButtonHandlerArgs = { control: PlayerControlButton };
