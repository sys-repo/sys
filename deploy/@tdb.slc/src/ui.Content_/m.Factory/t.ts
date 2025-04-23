import type { t } from '../common.ts';

/**
 * Content factory library.
 */
export type ContentFactoryLib = {
  entry(): Promise<t.StaticContent>;
  trailer(): Promise<t.VideoContent>;
  overview(): Promise<t.VideoContent>;
  programme(): Promise<t.VideoContent>;
};

/**
 * Content factory.
 */
export type ContentFactory = (id: t.ContentStage) => Promise<t.Content | undefined>;
