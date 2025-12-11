/**
 * @module Audiowaveform visualisation tools.
 */
import type { t } from './common.ts';
import { AudioWaveform as UI } from './ui.tsx';

import { useAudioAnalyser } from './use.AudioAnalyser.ts';
import { useDrawWaveform } from './use.DrawWaveform.ts';

/**
 * Renders an oscilloscope waveform visualization to a <canvas>.
 */
export const AudioWaveform: t.MediaAudioWaveformLib = {
  UI,
  useAudioAnalyser,
  useDrawWaveform,
};
