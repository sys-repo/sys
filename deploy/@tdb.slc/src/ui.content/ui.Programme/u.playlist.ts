import { type t, Is } from './common.ts';

/**
 * Merges a media element into a "section" level playlist.
 */
export function toPlaylist(media?: t.VideoMediaContent, options: { introTitle?: string } = {}) {
  if (!media) return [];
  const { introTitle = 'Introduction' } = options;

  const children = media.children ?? [];
  const hasChildren = children.length > 0;
  const title = hasChildren ? introTitle : media.title ?? 'Untitled';

  const res: t.VideoMediaContent[] = [{ ...media, title }];

  res.push(...children);
  return res.filter((m) => !Is.nil(m));
}
