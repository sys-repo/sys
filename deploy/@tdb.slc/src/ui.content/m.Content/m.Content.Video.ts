import { type t } from './common.ts';
import { Is } from './m.Content.Is.ts';

export const Video: t.ContentVideoLib = {
  media(input) {
    if (!input) return undefined;
    const content = Is.video(input) ? input : input.content;
    const m = content.media;
    const media = !m ? [] : Array.isArray(m) ? m : [m];
    return media[content.mediaIndex ?? 0];
  },
};
