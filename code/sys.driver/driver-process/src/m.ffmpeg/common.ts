import type { t } from '../common.ts';
export * from '../common.ts';

export const DEFAULT = {
  bin: {
    ffprobe: 'ffprobe',
    ffmpeg: 'ffmpeg',
  },
} as const;

export const Msecs = {
  fromNumber(n: number): t.Msecs {
    if (!Number.isFinite(n)) throw new RangeError('Msecs must be a finite number');
    return n;
  },
} as const;
