import { AudioWaveform } from '../Media.AudioWaveform/mod.ts';
import { MediaRecorder as Recorder, useMediaRecorder } from '../Media.Recorder/mod.ts';
import { MediaVideo as Video, useUserMedia } from '../Media.Video/mod.ts';

import type { t } from './common.ts';
import { download } from './u.download.ts';

export const Media: t.MediaLib = {
  Video,
  Recorder,
  AudioWaveform,

  /**
   * Hooks:
   */
  useUserMedia,
  useMediaRecorder,

  /**
   * Helpers:
   */
  download,
};
