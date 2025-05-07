import type { t } from './common.ts';

/**
 * <Component>:
 */
export type MediaRecorderProps = {
  /** Augment the component with debug info when true. */
  debug?: boolean;
  /** Theme palette. */
  theme?: t.CommonTheme;
  /** Extra style(s) to merge with the base container. */
  style?: t.CssInput;
  /**
   * Media constraints for `getUserMedia`.
   * Defaults: `{ video: true, audio: true }`.
   */
  constraints?: MediaStreamConstraints;
  /**
   * Called once the stream is live and assigned to <video>.
   * Use this to hook up a MediaRecorder (or whatever).
   */
  onReady?: (stream: MediaStream) => void;
};
