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
    constraints?: MediaStreamConstraints | MediaStream,
    options?: { filter?: string; zoom?: Partial<t.MediaZoomValues> },
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
 * <Component>:
 */
export type MediaVideoStreamProps = {
  debug?: boolean;

  /** Media constraints for `getUserMedia`. Defaults: `{ video: true, audio: true }`. */
  constraints?: MediaStreamConstraints;
  /** Optionally provide the raw stream. The filtered derivative stream is still calculated. */
  stream?: MediaStream;
  /** Any CSS filter string: e.g. 'brightness(120%) hue-rotate(90deg)' */
  filter?: string;
  /** Options for applying a zoom effect to the media-stream. */
  zoom?: Partial<t.MediaZoomValues>;
  /** Muted state of the <video> element. */
  muted?: boolean;

  // Appearance:
  borderRadius?: t.Pixels;
  aspectRatio?: string | number; // eg:  16/9
  theme?: t.CommonTheme;
  style?: t.CssInput;

  /** Called once when the stream is live and assigned to <video>. */
  onReady?: MediaVideoStreamReadyHandler;
};

/**
 * Events:
 */
export type MediaVideoStreamReadyHandler = (e: MediaVideoStreamReady) => void;
export type MediaVideoStreamReady = {
  readonly stream: VideoStreamHook['stream'];
  readonly aspectRatio: string;
  readonly device: MediaDeviceInfo;
};

/**
 * Hook:
 * Acquire/cleanup device media with visual filter pass-through via <canvas>.
 */
export type UseVideoStream = (
  streamOrConstraints?: MediaStreamConstraints | MediaStream,
  options?: { filter?: string; zoom?: Partial<t.MediaZoomValues> },
) => VideoStreamHook;

export type VideoStreamHook = {
  readonly ready: boolean;
  readonly stream: { readonly filtered?: MediaStream; readonly raw?: MediaStream };
  readonly aspectRatio: string;
  readonly device?: MediaDeviceInfo;
  readonly error?: t.StdError;
};
