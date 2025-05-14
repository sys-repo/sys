import { AudioWaveform } from '../Media.AudioWaveform/mod.ts';
import {
  MediaRecorder as Recorder,
  useMediaRecorder as useRecorder,
} from '../Media.Recorder/mod.ts';
import { VideoStream, useVideoStream } from '../Media.VideoStream/mod.ts';

import type { t } from './common.ts';
import { download } from './u.download.ts';

export const Media: t.MediaLib = {
  Video: VideoStream,
  Recorder,
  AudioWaveform,

  /**
   * Hooks:
   */
  useVideoStream,
  useRecorder,

  /**
   * Helper (util):
   */
  download,
};
