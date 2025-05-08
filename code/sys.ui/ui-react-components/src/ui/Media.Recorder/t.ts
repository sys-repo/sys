import type { t } from './common.ts';

export type MediaRecorderStatus = 'idle' | 'recording' | 'paused' | 'stopped';

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
) => UseMediaRecorderHook;

/** Options passed to the `UseMediaRecorder` hook. */
export type UseMediaRecorderOptions = { mimeType?: 'video/webm;codecs=vp9,opus' };

/**
 * UseMediaRecorder hook API.
 */
export type UseMediaRecorderHook = {
  readonly status: t.MediaRecorderStatus;
  readonly blob: Blob | undefined;
  readonly is: Readonly<UseMediaRecorderHookFlags>;
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
};

export type UseMediaRecorderHookFlags = {
  idle: boolean;
  recording: boolean;
  paused: boolean;
  stopped: boolean;
  started: boolean;
};
