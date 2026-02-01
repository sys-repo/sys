import { type t, SlugSchema } from '../common.ts';
import { fromDag } from './u.fromDag.ts';
import { Normalize } from './u.normalize.ts';

const { Is, validate } = SlugSchema.MediaComposition.Sequence;

export const Sequence: t.SlugSequenceLib = {
  Is,
  Normalize,
  fromDag,
  validate,
};
