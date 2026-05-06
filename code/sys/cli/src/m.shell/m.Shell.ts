import type { Shell as TShell } from './t.ts';
import { Block } from './u.block.ts';

/**
 * Pure shell PATH and alias planning substrate.
 */
export const Shell: TShell.Lib = {
  Alias: {},
  Path: {},
  Block,
  Plan: {},
};
