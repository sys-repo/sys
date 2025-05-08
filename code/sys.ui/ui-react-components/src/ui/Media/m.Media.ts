import { MediaRecorder as Recorder, useMediaRecorder } from '../Media.Recorder/mod.ts';
import { MediaVideo as Video, useUserMedia } from '../Media.Video/mod.ts';
import { type t } from './common.ts';

export const Media: t.MediaLib = {
  Video,
  Recorder,

  // Hooks:
  useUserMedia,
  useMediaRecorder,
};
