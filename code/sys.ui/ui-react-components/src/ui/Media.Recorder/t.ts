import type { t } from './common.ts';

/**
 * <Component>:
 */
export type MediaRecorderProps = {
  /** Augment the component with debug info when true. */
  debug?: boolean;

  /** Media constraints for `getUserMedia`. Defaults: `{ video: true, audio: true }`. */
  constraints?: MediaStreamConstraints;

  /**
   * Apperance:
   */
  theme?: t.CommonTheme;
  style?: t.CssInput;
  /** The rounded corners on the element */
  borderRadius?: t.Pixels;
  /** Explicit aspect ratio (`width / height`). */
  aspectRatio?: number;
  /** How the video should fill its box (default `"responsive"`). */
  fit?: 'responsive' | 'cover' | 'contain';

  /**
   * Handlers:
   */
  /** Called once when the stream is live and assigned to <video>. */
  onReady?: (stream: MediaStream) => void;
};
