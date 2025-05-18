import type { t } from './common.ts';
import { builder } from './u.builder.ts';
import { digest } from './u.digest.ts';
import { toComposite } from './u.toComposite.ts';
import { verify } from './u.verify.ts';
import { FileHashUri as File } from './m.Uri.ts';
import { size } from './u.size.ts';

export { FileHashUri } from './m.Uri.ts';

/**
 * Tools for building composite hashes.
 */
export const CompositeHash: t.CompositeHashLib = {
  Uri: { File },
  toComposite,
  builder,
  digest,
  verify,
  size,
};
