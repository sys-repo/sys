import type { t } from './common.ts';

/**
 * <Component>:
 */
export type MediaVideoProps = {
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
  fit?: t.MediaVideoFit;

  /** Called once when the stream is live and assigned to <video>. */
  onReady?: (e: { stream: MediaStream }) => void;
};

/** Layout fit modes for the <MediaVideo> component. */
export type MediaVideoFit = 'AspectRatio' | 'Cover' | 'Contain';

/**
 * Hook: Acquire/cleanup device media.
 */
export type UseUserMedia = (constraints: MediaStreamConstraints) => UserMediaHook;
export type UserMediaHook = {
  readonly stream?: MediaStream;
  readonly error?: DOMException;
};
