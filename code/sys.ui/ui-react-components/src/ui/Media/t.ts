import type { t } from './common.ts';

/**
 * Media stream UI and helpers.
 */
export type MediaLib = {
  readonly UI: {
    readonly AudioWaveform: React.FC<t.AudioWaveformProps>;
  };

  readonly Video: t.MediaVideoLib;
  readonly Recorder: t.MediaRecorderLib;
  readonly Devices: t.MediaDevicesLib;
  readonly Config: t.MediaConfigLib;

  // Helpers:
  download(blob?: Blob, filename?: string): void;
};
