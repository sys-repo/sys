import { AudioWaveform } from '../Media.AudioWaveform/mod.ts';
import { Recorder } from '../Media.Recorder/mod.ts';
import { Video } from '../Media.Video/mod.ts';

import type { t } from './common.ts';
import { download } from './u.download.ts';

export const Media: t.MediaLib = {
  Video,
  Recorder,
  AudioWaveform,

  /**
   * Helper (util):
   */
  download,
};
