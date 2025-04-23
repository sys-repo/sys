import type { t } from './common.ts';

/**
 * Content library API.
 */
export type ContentLib = {
  readonly Is: t.ContentIs;
  readonly Video: t.ContentVideoLib;
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

/**
 * Tools for working with video content
 */
export type ContentVideoLib = {
  /**
   * Retrieve the current media item.
   * Resolves single item, or array list, and performs automatic index lookup.
   */
  media(content?: t.VideoContent | t.VideoContentProps): {
    readonly items: t.VideoContentMedia[];
    readonly current?: t.VideoContentMedia;
  };
};
