import type { t } from '../common.ts';
import type { ContentFactoryLib } from './t.ts';

export const Factory: ContentFactoryLib = {
  entry: async (opt) => (await import('../../ui.Entry/mod.ts')).factory(opt),
  trailer: async (opt) => (await import('../../ui.Trailer/mod.ts')).factory(opt),
  overview: async (opt) => (await import('../../ui.Overview/mod.ts')).factory(opt),
  programme: async (opt) => (await import('../../ui.Programme/mod.ts')).factory(opt),
} as const;

/**
 * Look up and dynamically import the content for the given ID.
 */
export const factory: t.ContentFactory = async (id, options = {}) => {
  if (id === 'Entry') return Factory.entry(options);
  if (id === 'Trailer') return Factory.trailer(options);
  if (id === 'Overview') return Factory.overview(options);
  if (id === 'Programme') return Factory.programme(options);

  // Not found.
  console.warn(`Content with id "${id}" not found.`);
  return undefined;
};
