import React from 'react';
import { type t } from './common.ts';

/**
 * View Factory:
 */
export async function factory(id: string): Promise<t.ViewFactoryResponse> {
  const key = id as t.SampleFactoryId;
  const done = (Component: React.FC<any>): t.ViewFactoryResponse => ({ default: Component });

  if (key === 'VideoPlayer:host') {
    const { VideoHost } = await import('./-views/VideoPlayer.Host.tsx');
    return done(VideoHost);
  }

  if (key === 'SectionTree:host') {
    const { SectionHost } = await import('./-views/Section.Host.tsx');
    return done(SectionHost);
  }

  // Not found.
  return { default: () => null };
}
