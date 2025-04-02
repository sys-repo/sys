import { type t } from './common.ts';

/**
 * Looks up the content for the given ID.
 */
export async function factory(id: t.ContentStage): Promise<t.Content | undefined> {
  if (id === 'Entry') {
    const { factory } = await import('../../ui.Content/ui.Entry/factory.tsx');
    return factory();
  }

  if (id === 'Trailer') {
    const { factory } = await import('../../ui.Content/ui.Trailer/factory.tsx');
    return factory();
  }

  if (id === 'Overview') {
    const { factory } = await import('../../ui.Content/ui.Overview/factory.tsx');
    return factory();
  }

  if (id === 'Programme') {
    const { factory } = await import('../../ui.Content/ui.Programme/factory.tsx');
    return factory();
  }

  // Not found.
  return undefined;
}
