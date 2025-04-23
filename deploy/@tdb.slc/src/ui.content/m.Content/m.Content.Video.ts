import { type t } from './common.ts';
import { Is } from './m.Content.Is.ts';

export const Video: t.ContentVideoLib = {
  media(input) {
    if (!input) return { list: [] };
    const content = Is.video(input) ? input : input.content;
    const m = content.media;
    const list = !m ? [] : Array.isArray(m) ? m : [m];
    const current = list[content.mediaIndex ?? 0];
    return { list, current };
  },
};
