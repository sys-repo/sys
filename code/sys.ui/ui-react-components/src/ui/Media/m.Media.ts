import { AudioWaveform } from '../Media.AudioWaveform/mod.ts';
import { Devices } from '../Media.Devices/mod.ts';
import { Recorder } from '../Media.Recorder/mod.ts';
import { Config } from '../Media.Config/mod.ts';
import { Video } from '../Media.Video/mod.ts';
import { Zoom } from '../Media.Zoom/mod.ts';

import type { t } from './common.ts';
import { download } from './u.download.ts';

export const Media: t.MediaLib = {
  UI: { AudioWaveform },

  Devices,
  Video,
  Recorder,
  Config,
  Zoom,

  /**
   * Helper (util):
   */
  download,
};
