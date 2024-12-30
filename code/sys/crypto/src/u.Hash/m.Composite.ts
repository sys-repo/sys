import type { t } from './common.ts';
import { builder } from './u.comp.builder.ts';
import { digest } from './u.comp.digest.ts';
import { verify } from './u.comp.verify.ts';
import { toComposite } from './u.toComposite.ts';

export const CompositeHash: t.CompositeHashLib = {
  toComposite,
  builder,
  digest,
  verify,
};
