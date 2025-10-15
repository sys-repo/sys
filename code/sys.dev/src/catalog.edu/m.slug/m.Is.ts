import { type t, Is as is } from './common.ts';

export const Is: t.SlugIsLib = {
  videoRecorderBinding(m: any): m is t.VideoRecorderBinding {
    return is.record(m) && m.id === 'video-recorder' && is.string(m.as) && m.as.length > 0;
  },
} as const;
