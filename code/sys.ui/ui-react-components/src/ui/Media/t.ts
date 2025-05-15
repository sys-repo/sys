import type { t } from './common.ts';

/**
 * Media stream UI and helpers.
 */
export type MediaLib = {
  readonly UI: {
    readonly AudioWaveform: React.FC<t.AudioWaveformProps>;
    readonly Filters: React.FC<t.MediaFiltersProps>;
  };

  readonly Video: t.MediaVideoLib;
  readonly Recorder: t.MediaRecorderLib;
  readonly Devices: t.MediaDevicesLib;

  // Helpers:
  download(blob?: Blob, filename?: string): void;
};
