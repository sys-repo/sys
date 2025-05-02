import type { t } from './common.ts';
import { builder } from './u.builder.ts';
import { digest } from './u.digest.ts';
import { toComposite } from './u.toComposite.ts';
import { verify } from './u.verify.ts';
import { Uri } from './m.Uri.ts';

/**
 * Tools for building composite hashes.
 */
export const CompositeHash: t.CompositeHashLib = {
  Uri,
  toComposite,
  builder,
  digest,
  verify,
};
