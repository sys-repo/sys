import { type t } from './common.ts';

/**
 * Looks up the content for the given ID.
 */
export async function find(id: t.ContentStage): Promise<t.Content | undefined> {
  if (id === 'Entry') {
    const { factory } = await import('../App.Content.ui/factory.Entry.tsx');
    return factory();
  }

  if (id === 'Trailer') {
    const { factory } = await import('../App.Content.ui/factory.Trailer.tsx');
    return factory();
  }

  if (id === 'Overview') {
    const { factory } = await import('../App.Content.ui/factory.Overview.tsx');
    return factory();
  }

  if (id === 'Programme') {
    const { factory } = await import('../App.Content.ui/factory.Programme.tsx');
    return factory();
  }
}
