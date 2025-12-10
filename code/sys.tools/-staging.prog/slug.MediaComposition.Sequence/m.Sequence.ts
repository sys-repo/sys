import type { t } from '../common.ts';
import { SequenceIs as Is } from './m.Is.ts';
import { fromDag } from './u.fromDag.ts';
import { Normalize } from './u.normalize.ts';
import { validateSequence as validate } from './u.schema.validate.ts';

export const Sequence: t.SlugSequenceLib = {
  Is,
  Normalize,
  validate,
  fromDag,
};
