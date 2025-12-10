import { type t } from './common.ts';
import { fromNormalized } from './u.fromNormalized.ts';
import { fromDag } from './u.fromDag.ts';

export const Playback: t.MediaComposition.Playback.Lib = {
  fromDag,
  fromNormalized,
};
