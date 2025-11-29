import { Url as Base } from '@sys/std';
import type { t } from './common.ts';
import { ref } from './u.ref.ts';

export const Url: t.ImmutableUrlLib = {
  ...Base,
  ref,
};
