import type { t } from './common.ts';

/**
 * <Component>:
 */
export type AvatarProps = {
  stream?: MediaStream;
  muted?: boolean;

  // Appearance:
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  aspectRatio?: string;
  borderRadius?: t.Pixels;
  borderWidth?: t.Pixels;
  borderColor?: string | number;

  // Events:
  onReady?: t.MediaVideoStreamReadyHandler;
  onPointer?: t.PointerEventsHandler;
};
