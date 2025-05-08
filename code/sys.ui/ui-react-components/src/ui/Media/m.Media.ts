import { MediaRecorder as Recorder, useMediaRecorder } from '../Media.Recorder/mod.ts';
import { MediaVideo as Video, useUserMedia } from '../Media.Video/mod.ts';
import { type t } from './common.ts';

export const Media: t.MediaLib = {
  Video,
  Recorder,

  /**
   * Hooks:
   */
  useUserMedia,
  useMediaRecorder,

  /**
   * Helpers:
   */
  download(blob, filename = 'recording') {
    filename = filename.trim().replace(/\.webm$/, '');
    filename = `${filename}.webm`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};
