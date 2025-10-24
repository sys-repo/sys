import type { t } from './common.ts';

/** Status flags for the current state of the recorder. */
export type MediaRecorderState = 'Idle' | 'Recording' | 'Paused' | 'Stopped';

/**
 * Library: Media recording tools.
 */
export type MediaRecorderLib = {
  readonly UI: {
    readonly Files: React.FC<t.MediaRecorderFilesProps>;
    readonly useRecorder: t.UseMediaRecorder;
  };
  createRecorder: t.CreateMediaRecorder;
  captureInfo(stream?: MediaStream): t.MediaRecorderCapture;
};

/**
 * <Component>:
 */
export type MediaRecorderFilesProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Hook: Controller for recording a media-stream.
 */
export type UseMediaRecorder = (
  stream?: MediaStream,
  options?: MediaRecorderOptions,
) => MediaRecorderHook;

/** Options passed to the `UseMediaRecorder` hook. */
export type MediaRecorderOptions = {
  mimeType?: string;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  onStatusChange?: t.MediaRecorderStatusHandler;
};

/** Callbacks for status changes */
export type MediaRecorderStatusHandler = (e: MediaRecorderStatus) => void;
export type MediaRecorderStatus = {
  readonly state: t.MediaRecorderState;
  readonly elapsed: t.Msecs;
  readonly is: t.MediaRecorderHook['is'];
  readonly bytes: t.MediaRecorderHook['bytes'];
  readonly bitrate: t.MediaRecorderBitrate;
  readonly capture: t.MediaRecorderCapture;
};

/**
 * Create a high-quality, standards-compliant MediaRecorder for a given stream.
 */
export type CreateMediaRecorder = (
  stream: MediaStream,
  options?: t.MediaRecorderOptions,
) => MediaRecorder;

/**
 * UseMediaRecorder hook API:
 */
export type MediaRecorderHook = {
  readonly state: t.MediaRecorderState;
  readonly is: Readonly<MediaRecorderHookFlags>;
  readonly blob: Blob | undefined;
  readonly bytes: t.NumberBytes;
  readonly bitrate: t.MediaRecorderBitrate;
  readonly capture: t.MediaRecorderCapture;
  readonly elapsed: t.Msecs;
  /** Start recording. */
  start(): void;
  /** Pause recording. */
  pause(): void;
  resume(): void;
  /**
   * Stop recording and return a promise that resolves
   * once the <MediaRecorder> has fully flushed the blob.
   */
  stop(): Promise<MediaRecorderHookStopped>;
  /** Reset the recorder clearing it of all prior recorded state. */
  reset(): Promise<void>;
};

/** Recorder state translated into boolean flags. */
export type MediaRecorderHookFlags = {
  idle: boolean;
  recording: boolean;
  paused: boolean;
  stopped: boolean;
  started: boolean;
};

/** Response from a recorder stop method call. */
export type MediaRecorderHookStopped = {
  blob?: Blob;
  bytes: t.NumberBytes;
};

/** Bitrate settings for a MediaRecorder. */
export type MediaRecorderBitrate = {
  readonly video: number;
  readonly audio: number;
};

/** Realized settings of the stream's primary video track. */
export type MediaRecorderCapture = {
  readonly width?: number;
  readonly height?: number;
  readonly frameRate?: number;
  readonly aspectRatio?: number;

  /** Track/device context (when available). */
  readonly deviceId?: string;
  readonly facingMode?: 'user' | 'environment' | 'left' | 'right' | string;
  readonly resizeMode?: 'none' | 'crop-and-scale' | string;

  /** Screen-capture specific (present on display tracks). */
  readonly displaySurface?: 'application' | 'browser' | 'monitor' | 'window' | string;
  readonly logicalSurface?: boolean;
  readonly cursor?: 'always' | 'motion' | 'never' | string;

  /** Grouping hint from UA (same physical device cluster). */
  readonly groupId?: string;

  /** From MediaStreamTrack (not part of getSettings but useful signal). */
  readonly contentHint?: string;
};
