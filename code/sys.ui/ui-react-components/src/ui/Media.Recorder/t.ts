import type { t } from './common.ts';

export type MediaRecorderStatus = 'Idle' | 'Recording' | 'Paused' | 'Stopped';

/**
 * Library: Media recordeing tools.
 */
export type MediaRecorderLib = {
  readonly createRecorder: t.CreateMediaRecorder;
  readonly UI: {
    readonly Files: React.FC<t.MediaRecorderFilesProps>;
    readonly useRecorder: t.UseMediaRecorder;
  };
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
  onStatusChange?: t.MediaRecorderStatusChangeHandler;
};

/** Callbacks for actino changes */
export type MediaRecorderStatusChangeHandler = (e: MediaRecorderStatusChange) => void;
export type MediaRecorderStatusChange = {
  status: t.MediaRecorderStatus;
  started: boolean;
  elapsed: t.Msecs;
  is: t.MediaRecorderHook['is'];
  bytes: t.MediaRecorderHook['bytes'];
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
  readonly status: t.MediaRecorderStatus;
  readonly is: Readonly<MediaRecorderHookFlags>;
  readonly blob: Blob | undefined;
  readonly bytes: t.NumberBytes;
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
