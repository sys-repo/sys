import { type t } from './common.ts';

import { AudioWaveform } from '../Media.AudioWaveform/mod.ts';
import { Config } from '../Media.Config/mod.ts';
import { Devices } from '../Media.Devices/mod.ts';
import { Recorder } from '../Media.Recorder/mod.ts';
import { Video } from '../Media.Video/mod.ts';
import { AspectRatio } from './m.AspectRatio.ts';
import { Is } from './m.Is.ts';
import { Log } from './m.Log.ts';
import { ToObject, toObject } from './u.toObject.ts';

import { download } from './u.download.ts';

export const Media: t.Media.Lib = {
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
  ToObject,
  toObject,

  // Helpers (util):
  download,
};
