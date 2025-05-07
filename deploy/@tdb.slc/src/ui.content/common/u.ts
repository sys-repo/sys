import type { t } from '../common.ts';

/**
 * Standard video/media configuration setup.
 */
export const v = (src: string): t.VideoMediaContent['video'] => {
  return {
    src,
    fadeMask: 15,
    enlargeBy: 2,
  };
};
