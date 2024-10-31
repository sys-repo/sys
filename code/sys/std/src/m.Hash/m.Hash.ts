import type { t } from './common.ts';
import { CompositeHash as Composite } from './m.Composite.ts';
import { sha1, sha256, toBytes, toHex } from './u.hash.ts';
import { shorten } from './u.ts';
import { Is } from './m.Is.ts';

export { sha1, sha256 };

export const Hash: t.HashLib = {
  Is,
  Composite,
  composite: Composite.create,

  sha1,
  sha256,
  toBytes,
  toHex,
  shorten,
};
