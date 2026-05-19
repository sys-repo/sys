/**
 * @module
 * Bounded, transport-independent Files model and command grammar.
 */
import type { t } from './common.ts';
import { Cmd } from './m.Cmd.ts';
import { Cursor } from './m.Cursor.ts';
import { Policy } from './m.Policy.ts';

export type * from './t.ts';

/**
 * Bounded, transport-independent Files model and command grammar.
 */
export const Files: t.Files.Lib = {
  Cmd,
  Cursor,
  Policy,
};
