import type { t } from './common.ts';
import { CompositeHash as Composite } from './m.Composite.ts';
import { sha1, sha256, toBytes, toHex } from './u.hash.ts';
import { shorten } from './u.ts';

export { sha1, sha256 };

export const Hash: t.HashLib = {
  Composite,
  composite: Composite.create,

  sha1,
  sha256,
  toBytes,
  toHex,
  shorten,
};
