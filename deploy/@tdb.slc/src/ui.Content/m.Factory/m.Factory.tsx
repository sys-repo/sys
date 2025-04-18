import type { t } from '../common.ts';

export const Factory: t.ContentFactoryLib = {
  entry: async () => (await import('../ui.Entry/mod.ts')).factory(),
  trailer: async () => (await import('../ui.Trailer/mod.ts')).factory(),
  overview: async () => (await import('../ui.Overview/mod.ts')).factory(),
  programme: async () => (await import('../ui.Programme/mod.ts')).factory(),
} as const;

/**
 * Look up and dynamically import the content for the given ID.
 */
export const factory: t.ContentFactory = async (id) => {
  if (id === 'Entry') return Factory.entry();
  if (id === 'Trailer') return Factory.trailer();
  if (id === 'Overview') return Factory.overview();
  if (id === 'Programme') return Factory.programme();

  // Not found.
  console.warn(`Content with id "${id}" not found.`);
  return undefined;
};
