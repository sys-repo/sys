import type { t } from './common.ts';

/**
 * Tools for visually filtering over a media streams.
 */
export type MediaVideoLib = {
  /**
   * Calculate the aspect ratio for a media stream.
   */
  readonly AspectRatio: MediaAspectRatioLib;

  /**
   * Build a MediaStream whose video is run through a CSS-filter pipeline.
   *
   * @param constraints – any valid getUserMedia constraints (eg { video: true, audio: true })
   * @param filter      – any CSS filter string, eg 'brightness(120%) contrast(110%)'
   *
   * The returned stream has:
   *   • filtered video track (from the canvas).
   *   • original audio track(s) from the raw camera.
   */
  getStream(args: {
    constraints?: MediaStreamConstraints;
    filter?: string;
    preferPhoneCamera?: boolean;
  }): Promise<MediaStream>;

  /**
   * UI components:
   */
  readonly View: {
    Stream: React.FC<t.VideoStreamProps>;
  };

  /**
   * Hooks:
   */
  readonly useVideoStream: t.UseVideoStream;
};

/**
 * Tools for calculating aspect ratios from media streams.
 */
export type MediaAspectRatioLib = {
  toNumber(stream: MediaStream): number;
  toString(stream: MediaStream, options?: { maxDenominator?: number }): string;
};

/**
 * <Component>:
 */
export type VideoStreamProps = {
  debug?: boolean;

  /** Optional filter to apply. */
  filter?: string;

  /** Media constraints for `getUserMedia`. Defaults: `{ video: true, audio: true }`. */
  constraints?: MediaStreamConstraints;

  // Appearance:
  borderRadius?: t.Pixels;
  aspectRatio?: string | number; // eg:  16/9
  theme?: t.CommonTheme;
  style?: t.CssInput;

  /** Called once when the stream is live and assigned to <video>. */
  onReady?: (e: { stream: MediaStream; aspectRatio: string }) => void;
};

/**
 * Hook: Acquire/cleanup device media with visual filter pass-through via <canvas>.
 */
export type UseVideoStream = (args: {
  constraints?: MediaStreamConstraints;
  filter?: string;
}) => VideoStreamHook;
export type VideoStreamHook = {
  readonly stream?: MediaStream;
  readonly aspectRatio: string;
  readonly error?: t.StdError;
};
