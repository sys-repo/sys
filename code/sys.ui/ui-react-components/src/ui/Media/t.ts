import type { t } from './common.ts';

/**
 * Media stream UI and helpers.
 */
export type MediaLib = {
  readonly AudioWaveform: React.FC<t.AudioWaveformProps>;
  readonly VideoStream: React.FC<t.MediaVideoStreamProps>;
  readonly Recorder: React.FC<t.MediaRecorderProps>;

  // Hooks:
  readonly useVideoStream: t.UseVideoStream;
  readonly useRecorder: t.UseMediaRecorder;

  // Helpers:
  download(blob?: Blob, filename?: string): void;
};
