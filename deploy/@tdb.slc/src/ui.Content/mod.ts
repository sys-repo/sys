import type { t } from './common.ts';
import { Factory } from './-factory/mod.ts';

export const Content = {
  Factory,

  /**
   * Looks up the content for the given ID.
   */
  async factory(id: t.ContentStage) {
    if (id === 'Entry') return Factory.entry();
    if (id === 'Trailer') return Factory.trailer();
    if (id === 'Overview') return Factory.overview();
    if (id === 'Programme') return Factory.programme();

    // Not found.
    return undefined;
  },
} as const;
