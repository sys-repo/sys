import type { t } from './common.ts';

/**
 * Media stream UI and helpers.
 */
export type MediaLib = {
  readonly AudioWaveform: React.FC<t.AudioWaveformProps>;
  readonly Video: t.MediaVideoLib;
  readonly Recorder: t.MediaRecorderLib;

  // Helpers:
  download(blob?: Blob, filename?: string): void;
};
