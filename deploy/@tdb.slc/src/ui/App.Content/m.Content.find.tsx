import { type t } from './common.ts';

/**
 * Looks up the content for the given ID.
 */
export async function find(id: t.Stage): Promise<t.Content | undefined> {
  if (id === 'Entry') {
    const { factory } = await import('../App.Content.ui/ui.Entry.tsx');
    return factory();
  }

  if (id === 'Trailer') {
    const { factory } = await import('../App.Content.ui/ui.Trailer.tsx');
    return factory();
  }

  if (id === 'Overview') {
    const { factory } = await import('../App.Content.ui/ui.Overview.tsx');
    return factory();
  }

  if (id === 'Programme') {
    const { factory } = await import('../App.Content.ui/ui.Programme.tsx');
    return factory();
  }
}
