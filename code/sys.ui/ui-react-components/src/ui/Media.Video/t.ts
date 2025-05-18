import type { t } from './common.ts';

/**
 * Tools for visually filtering over a media streams.
 */
export type MediaVideoLib = {
  /**
   * UI components:
   */
  readonly UI: {
    readonly Stream: React.FC<t.MediaVideoStreamProps>;
    readonly useVideoStream: t.UseVideoStream;
  };

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
  getStream(
    constraints?: MediaStreamConstraints,
    options?: { filter?: string },
  ): Promise<{ raw: MediaStream; filtered: MediaStream }>;

  /**
   * Given any MediaStream, return the MediaDeviceInfo that
   * corresponds to the video track (if discoverable).
   */
  getDevice(
    stream: MediaStream,
    kind?: MediaDeviceInfo['kind'],
  ): Promise<MediaDeviceInfo | undefined>;
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
export type MediaVideoStreamProps = {
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
  onReady?: (e: {
    stream: VideoStreamHook['stream'];
    aspectRatio: string;
    device: MediaDeviceInfo;
  }) => void;
};

/**
 * Hook: Acquire/cleanup device media with visual filter pass-through via <canvas>.
 */
export type UseVideoStream = (args: {
  constraints?: MediaStreamConstraints;
  filter?: string;
}) => VideoStreamHook;
export type VideoStreamHook = {
  readonly stream: {
    readonly filtered?: MediaStream;
    readonly raw?: MediaStream;
  };
  readonly aspectRatio: string;
  readonly device?: MediaDeviceInfo;
  readonly error?: t.StdError;
};
