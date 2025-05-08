import type { t } from './common.ts';

/**
 * Media stream UI and helpers.
 */
export type MediaLib = {
  readonly Video: React.FC<t.MediaVideoProps>;
  readonly Recorder: React.FC<t.MediaRecorderProps>;

  // Hooks:
  readonly useUserMedia: t.UseUserMedia;
  readonly useMediaRecorder: t.UseMediaRecorder;

  // Helpers:
  download(blob: Blob, filename?: string): void;
};
