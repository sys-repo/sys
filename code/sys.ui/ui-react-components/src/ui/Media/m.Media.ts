import type { MediaLib } from './t.ts';

import { AudioWaveform } from '../Media.AudioWaveform/mod.ts';
import { Config } from '../Media.Config/mod.ts';
import { Devices } from '../Media.Devices/mod.ts';
import { Recorder } from '../Media.Recorder/mod.ts';
import { Video } from '../Media.Video/mod.ts';
import { AspectRatio } from './m.AspectRatio.ts';
import { Is } from './m.Is.ts';
import { Log } from './m.Log.ts';

import { download } from './u.download.ts';

export const Media: MediaLib = {
  // Components:
  UI: { AudioWaveform },

  // Libs:
  Is,
  Log,
  AspectRatio,
  Devices,
  Video,
  Recorder,
  Config,

  // Helpers (util):
  download,
};
