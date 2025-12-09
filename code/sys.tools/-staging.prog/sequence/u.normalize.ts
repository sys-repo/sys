import { type t } from '../common.ts';
import { toTimecode } from './u.normalize.toTimecode.ts';

export * from './u.normalize.dsl.ts';

export const Normalize: t.SequenceNormalizeLib = {
  toTimecode,
};
