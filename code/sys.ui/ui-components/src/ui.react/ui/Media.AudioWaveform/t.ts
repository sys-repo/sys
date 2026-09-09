import type { t } from './common.ts';

/**
 * Library namespace
 */
export type MediaAudioWaveformLib = {
  readonly UI: React.FC<t.AudioWaveformProps>;

  /** Setup and maintain an [AudioStream] analyzer. */
  useAudioAnalyser(args: { stream?: MediaStream }): {
    readonly isActive: boolean;
    audioData?: Uint8Array<ArrayBufferLike>;
  };

  /** Renders an oscilloscope waveform visualization to a <canvas>. */
  useDrawWaveform(args: t.DrawWaveformArgs): void;
};

/** Draw Waveform Properties */
export type DrawWaveformProps = { lineColor?: string | number; lineWidth?: number };
/** Draw Waveform input arguments. */
export type DrawWaveformArgs = t.DrawWaveformProps & {
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  audioData?: Uint8Array;
};

/**
 * Component
 */
export type AudioWaveformProps = {
  debug?: boolean;
  stream?: MediaStream;

  lineColor?: string | number;
  lineWidth?: number;

  theme?: t.CommonTheme;
  style?: t.CssInput;
};
