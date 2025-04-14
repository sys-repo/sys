import type { t } from './common.ts';

/**
 * Content library API.
 */
export type ContentLib = {
  readonly Is: t.ContentIs;
  readonly Factory: t.ContentFactoryLib;
  readonly factory: t.ContentFactory;
};

/**
 * Content flags.
 */
export type ContentIs = {
  video(input: any): input is t.VideoContent;
  static(input: any): input is t.StaticContent;
};
