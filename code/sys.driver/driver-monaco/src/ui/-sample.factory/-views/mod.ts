import type { t } from '../common.ts';

/**
 * View Factory:
 */
export const getView: t.GetView = async (id) => {
  const key = id as t.SampleFactoryId;
  const done = (Component: React.FC<any>): t.ViewFactoryResponse => ({ default: Component });

  if (key === 'VideoPlayer:host') {
    const { VideoHost } = await import('./ui.VideoPlayer.Host.tsx');
    return done(VideoHost);
  }

  if (key === 'SectionTree:host') {
    const { SectionHost } = await import('./ui.Section.Host.tsx');
    return done(SectionHost);
  }

  // Not found.
  return { default: () => null };
};
