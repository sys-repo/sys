import { type t, Is, Player } from './common.ts';

/**
 * Standard video/media configuration setup.
 */
export const v = (src: string) => {
  return Player.Video.signals({
    src,
    fadeMask: 10,
    scale: (e) => e.enlargeBy(2),
  });
};

/**
 * Merges a media element into a "section" level playlist.
 */
export function toSectionPlaylist(
  media?: t.VideoMediaContent,
  options: { introTitle?: string } = {},
) {
  if (!media) return [];
  const { introTitle = 'Introduction' } = options;

  const children = media.children ?? [];
  const hasChildren = children.length > 0;
  const title = hasChildren ? introTitle : media.title ?? 'Untitled';

  const res: t.PlaylistItem[] = [{ ...media, title }];
  if (hasChildren) res.push('---');

  res.push(...children);
  return res.filter((m) => !Is.nil(m));
}
