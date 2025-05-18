import { AudioWaveform } from '../Media.AudioWaveform/mod.ts';
import { Devices } from '../Media.Devices/mod.ts';
import { Filters } from '../Media.Filters/mod.ts';
import { Recorder } from '../Media.Recorder/mod.ts';
import { Video } from '../Media.Video/mod.ts';

import type { t } from './common.ts';
import { download } from './u.download.ts';

export const Media: t.MediaLib = {
  UI: { AudioWaveform },

  Devices,
  Video,
  Recorder,
  Filters,

  /**
   * Helper (util):
   */
  download,
};
