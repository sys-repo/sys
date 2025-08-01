import type { t } from '../common.ts';
import { Type } from '../common.ts';

/**
 * Types:
 */
export const SampleFactoryId = Type.Union(
  [Type.Literal('VideoPlayer:host'), Type.Literal('SectionTree:host')],
  { description: 'Keys for looking up views within the factory.' },
);

export type SampleFactoryId = t.Static<typeof SampleFactoryId>;

/**
 * Factory:
 */
export const getView: t.GetView = async (id: t.SampleFactoryId | string) => {
  const key = id as t.SampleFactoryId;
  const done = (Component: React.FC<any>): t.ViewFactoryResponse => ({ default: Component });

  if (key === 'VideoPlayer:host') {
    const { VideoPlayerHost: VideoHost } = await import('./ui.VideoPlayer.Host.tsx');
    return done(VideoHost);
  }

  if (key === 'SectionTree:host') {
    const { SectionHost } = await import('./ui.Section.Host.tsx');
    return done(SectionHost);
  }

  // Not found.
  return { default: () => null };
};
