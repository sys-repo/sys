import { Player } from './common.ts';

export * from './u.Calc.ts';
export * from './u.playlist.ts';

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
