import type { t } from './common.ts';
import { Alias } from './u.alias.ts';
import { Block } from './u.block.ts';
import { Path } from './u.path.ts';

/**
 * Pure shell PATH and alias planning substrate.
 */
export const Shell: t.Shell.Lib = Object.freeze({
  Alias,
  Path,
  Block,
  Plan: Object.freeze({}),
});
