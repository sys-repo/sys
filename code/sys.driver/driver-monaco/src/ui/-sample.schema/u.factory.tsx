import React from 'react';
import { type t } from './common.ts';

export type LazyFactory = React.LazyExoticComponent<React.FC<any>>;
export * from './u.factory.update.ts';

/**
 * Dynamically imported components (cache).
 */
const map = new Map<string, LazyFactory>();

/**
 * Lazy loader:
 */
export function getLazy(id: t.SampleFactoryId): LazyFactory {
  if (!map.has(id)) {
    const lazy = React.lazy(async () => {
      const C = await factory(id);
      return C ? { default: C } : { default: () => null };
    });
    map.set(id, lazy);
  }
  return map.get(id)!;
}

/**
 * View Factory:
 */
export async function factory(id: t.SampleFactoryId) {
  if (id === 'factory:video:host') {
    const { VideoHost } = await import('./-views/Video.Host.tsx');
    return VideoHost;
  }

  // No match.
  return null;
}
