import type { t } from './common.ts';

export type MediaRecorderStatus = 'Idle' | 'Recording' | 'Paused' | 'Stopped';

/**
 * <Component>:
 */
export type MediaRecorderProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Hook: Controller for recording a media-stream.
 */
export type UseMediaRecorder = (
  stream?: MediaStream,
  options?: UseMediaRecorderOptions,
) => MediaRecorderHook;
/** Options passed to the `UseMediaRecorder` hook. */
export type UseMediaRecorderOptions = {
  mimeType?: 'video/webm;codecs=vp9,opus';
};

/**
 * UseMediaRecorder hook API:
 */
export type MediaRecorderHook = {
  readonly status: t.MediaRecorderStatus;
  readonly is: Readonly<MediaRecorderHookFlags>;
  readonly blob: Blob | undefined;
  readonly bytes: t.NumberBytes;
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
