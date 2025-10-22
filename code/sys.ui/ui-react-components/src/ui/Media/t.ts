import type { t } from './common.ts';

export type * from './t.Is.ts';
export type * from './t.Object.ts';

/**
 * Media stream UI and helpers.
 */
export type MediaLib = {
  readonly UI: { readonly AudioWaveform: React.FC<t.AudioWaveformProps> };
  readonly Video: t.MediaVideoLib;
  readonly Recorder: t.MediaRecorderLib;
  readonly Devices: t.MediaDevicesLib;
  readonly Config: t.MediaConfigLib;
  readonly AspectRatio: t.MediaAspectRatioLib;
  readonly Is: t.MediaIsLib;
  readonly Log: t.MediaLogLib;
  readonly ToObject: t.MediaToObjectLib;
  readonly toObject: t.MediaToObjectRoute;

  // Helper methods:
  download(blob?: Blob, filename?: string): void;
};

/**
 * Tools for calculating aspect ratios from media streams.
 */
export type MediaAspectRatioLib = {
  toNumber(stream: MediaStream): number;
  toString(stream: MediaStream, options?: { maxDenominator?: number }): string;
};

/**
 * Helpers for logging Media.
 */
export type MediaLogLib = {
  tracks(label: string, stream?: MediaStream): void;
};
