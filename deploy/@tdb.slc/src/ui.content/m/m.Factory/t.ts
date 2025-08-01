import type { t } from '../common.ts';

type Opt = t.ContentFactoryOptions;

/**
 * Content factory library.
 * NB: Dynamic code splitting happens here.
 */
export type ContentFactoryLib = {
  entry(options?: Opt): Promise<t.StaticContent>;
  trailer(options?: Opt): Promise<t.VideoContent>;
  overview(options?: Opt): Promise<t.VideoContent>;
  programme(options?: Opt): Promise<t.VideoContent>;
};

/**
 * Content factory.
 */
export type ContentFactory = (
  id: t.ContentStage,
  options?: ContentFactoryOptions,
) => Promise<t.Content | undefined>;

export type ContentFactoryOptions = { muted?: boolean };
