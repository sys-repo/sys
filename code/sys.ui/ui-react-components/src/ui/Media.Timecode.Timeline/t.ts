import type { t } from './common.ts';

/** Type exports: */
export type * from './-dev/t.ts';
export type * from './-spec/-t.spec.ts';

export type MediaTimelineLib = {
  readonly Dev: { readonly Harness: t.FC<t.MediaTimelineHarnessProps> };
};
