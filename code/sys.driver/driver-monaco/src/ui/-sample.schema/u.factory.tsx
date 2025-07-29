import React from 'react';
import { type t } from './common.ts';

export type LazyFactory = React.LazyExoticComponent<React.FC<any>>;
export type FactoryResponse = { default: React.FC<any> };

/** Cache: Dynamically imported components. */
const map = new Map<string, LazyFactory>();

/**
 * Lazy loader:
 */
export function getLazy(id: string): LazyFactory {
  if (!map.has(id)) {
    const lazy = React.lazy(() => factory(id));
    map.set(id, lazy);
  }
  return map.get(id)!;
}

/**
 * View Factory:
 */
export async function factory(id: string): Promise<FactoryResponse> {
  const key = id as t.SampleFactoryId;
  const done = (Component: React.FC<any>): FactoryResponse => ({ default: Component });

  if (key === 'video:host') {
    const { VideoHost } = await import('./-views/Video.Host.tsx');
    return done(VideoHost);
  }

  if (key === 'section:host') {
    const { SectionHost } = await import('./-views/Section.Host.tsx');
    return done(SectionHost);
  }

  // Not found.
  return { default: () => null };
}
