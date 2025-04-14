/**
 * @module
 * Content library
 */
import { type t, isRecord } from './common.ts';

export const Is: t.ContentIs = {
  video(input): input is t.VideoContent {
    return isRecord(input) && (input as t.VideoContent)['-type'] === 'VideoContent';
  },

  static(input): input is t.StaticContent {
    return isRecord(input) && (input as t.StaticContent)['-type'] === 'StaticContent';
  },
} as const;
