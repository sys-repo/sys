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
  readonly AspectRatio: t.MediaAspectRatioLib;
  readonly Is: t.MediaIsLib;
  readonly Log: t.MediaLogLib;

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
 * Flags for evaluating media/video related values.
 */
export type MediaIsLib = {
  mediaStream(input?: unknown): input is MediaStream;
  constraints(input?: unknown): input is MediaStreamConstraints;
};

/**
 * Helpers for logging Media.
 */
export type MediaLogLib = {
  tracks(label: string, stream?: MediaStream): void;
};
