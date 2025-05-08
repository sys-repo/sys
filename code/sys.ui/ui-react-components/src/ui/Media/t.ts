import type { t } from './common.ts';

/**
 * Media stream UI and helpers.
 */
export type MediaLib = {
  Video: React.FC<t.MediaVideoProps>;
  Recorder: React.FC<t.MediaRecorderProps>;
};
