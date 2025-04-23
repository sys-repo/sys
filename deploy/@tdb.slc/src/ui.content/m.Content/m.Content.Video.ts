import { type t } from './common.ts';
import { Is } from './m.Content.Is.ts';

export const Video: t.ContentVideoLib = {
  media(input) {
    if (!input) return { items: [] };
    const content = Is.video(input) ? input : input.content;
    const m = content.media;
    const items = !m ? [] : Array.isArray(m) ? m : [m];
    const current = items[content.mediaIndex ?? 0];
    return { items, current };
  },
};
