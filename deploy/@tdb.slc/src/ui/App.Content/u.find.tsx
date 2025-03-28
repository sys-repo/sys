import { type t } from './common.ts';
// import { create as createTrailer } from './ui.Trailer.tsx';

/**
 * Looks up the content for the given ID.
 */
export async function find(id: t.Stage): Promise<t.AppContent | undefined> {
  if (id === 'Entry') {
    const { create } = await import('./ui.Entry.tsx');
    console.log('create', create);
    return create();
  }

  if (id === 'Trailer') {
    const { create } = await import('./ui.Trailer.tsx');
    return create();
  }

  if (id === 'Overview') {
    const { create } = await import('./ui.Overview.tsx');
    return create();
  }

  if (id === 'Programme') {
    const { create } = await import('./ui.Programme.tsx');
    return create();
  }
}
