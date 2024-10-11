import { A } from './common.ts';
import { create } from './Lens.impl.ts';
import { Registry } from './Lens.Registry.ts';

/**
 * Lens for operating on a sub-tree within a CRDT.
 */
export const Lens = {
  create,
  Registry,
  splice: A.splice,
} as const;
