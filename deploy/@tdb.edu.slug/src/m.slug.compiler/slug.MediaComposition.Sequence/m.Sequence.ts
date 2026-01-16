import type { t } from '../common.ts';
import { SequenceIs as Is } from '../../m.slug.schema/slug.MediaComposition.Sequence/m.Is.ts';
import { fromDag } from './u.fromDag.ts';
import { Normalize } from './u.normalize.ts';
import { validateSequence as validate } from '../../m.slug.schema/slug.MediaComposition.Sequence/u.schema.validate.ts';

export const Sequence: t.SequenceLib = {
  Is,
  Normalize,
  validate,
  fromDag,
};
