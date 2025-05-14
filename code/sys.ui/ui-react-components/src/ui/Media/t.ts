import type { t } from './common.ts';

/**
 * Media stream UI and helpers.
 */
export type MediaLib = {
  readonly AudioWaveform: React.FC<t.AudioWaveformProps>;
  readonly Video: t.VideoLib;
  readonly Recorder: React.FC<t.MediaRecorderProps>;

  readonly useRecorder: t.UseMediaRecorder;

  // Helpers:
  download(blob?: Blob, filename?: string): void;
};
