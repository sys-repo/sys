import type { t } from '../common.ts';

/**
 * Looks up the content for the given ID.
 */
export async function factory<T = t.ContentStage>(id: T): Promise<t.Content | undefined> {
  if (id === 'Entry') {
    const { factory } = await import('../ui.Entry/mod.tsx');
    return factory();
  }

  if (id === 'Trailer') {
    const { factory } = await import('../ui.Trailer/mod.tsx');
    return factory();
  }

  if (id === 'Overview') {
    const { factory } = await import('../ui.Overview/mod.tsx');
    return factory();
  }

  if (id === 'Programme') {
    const { factory } = await import('../ui.Programme/mod.tsx');
    return factory();
  }

  // Not found.
  return undefined;
}
