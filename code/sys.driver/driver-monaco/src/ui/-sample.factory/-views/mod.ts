import type { Static, TLiteral, TUnion } from '@sys/schema/t';
import { type t, Type } from '../common.ts';

/**
 * Type: Keys for looking up views within the factory.
 */
const U: TUnion<
  [
    TLiteral<'VideoPlayer:host'>,
    TLiteral<'SectionTree:host'>,
    TLiteral<'Fileshare:host'>,
    TLiteral<'IFrame:host'>,
  ]
> = Type.Union(
  [
    Type.Literal('VideoPlayer:host'),
    Type.Literal('SectionTree:host'),
    Type.Literal('Fileshare:host'),
    Type.Literal('IFrame:host'),
  ],
  {
    description: 'Keys for looking up views within the factory.',
  },
);
export type SampleFactoryId = Static<typeof U>;
export const SampleFactoryId = U;

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

  if (key === 'Fileshare:host') {
    const { FileshareHost } = await import('./ui.Fileshare.Host.tsx');
    return done(FileshareHost);
  }

  if (key === 'IFrame:host') {
    const { IFrameHost } = await import('./ui.IFrame.Host.tsx');
    return done(IFrameHost);
  }

  // Not found.
  return { default: () => null };
};
