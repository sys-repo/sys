import { VIDEO } from '../-VIDEO.ts';
import { type t, Is, Player } from './common.ts';

export const DUMMY = VIDEO.Programme.Intro.About.src; // TEMP 🐷
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
export function toSectionPlaylist(media?: t.VideoMediaContent) {
  if (!media) return [];
  const children = media.children ?? [];
  const hasChildren = children.length > 0;
  const title = hasChildren ? 'Preface' : media.title ?? 'Untitled';

  const res: t.PlaylistItem[] = [{ ...media, title }];
  if (hasChildren) res.push('---');

  res.push(...children);
  return res.filter((m) => !Is.nil(m));
}
