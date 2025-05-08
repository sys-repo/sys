import { MediaVideo as Video } from '../Media.Video/mod.ts';
import { MediaRecorder as Recorder } from '../Media.Recorder/mod.ts';
import { type t } from './common.ts';

export const Media: t.MediaLib = {
  Video,
  Recorder,
};
