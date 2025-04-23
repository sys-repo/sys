import { type t } from './common.ts';
import { Is } from './m.Content.Is.ts';

export const Video: t.ContentVideoLib = {
  media(input) {
    if (!input) return { items: [], current: undefined };
    const content = Is.video(input) ? input : input.content;
    const items = content.media ?? [];
    const current = items[content.mediaIndex ?? 0];
    return { items, current };
  },
};
