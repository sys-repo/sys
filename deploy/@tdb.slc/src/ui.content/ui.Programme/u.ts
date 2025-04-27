import { VIDEO } from '../-VIDEO.ts';
import { Player } from './common.ts';

export const DUMMY = VIDEO.Programme.Intro.About.src; // TEMP 🐷
export const v = (src: string) =>
  Player.Video.signals({
    src,
    fadeMask: 10,
    scale: (e) => e.enlargeBy(2),
  });

const timestamps = {};
