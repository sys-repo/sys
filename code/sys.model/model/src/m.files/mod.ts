/**
 * @module
 * Bounded Files model, command grammar, content refs, and typed client adapters.
 */
import type { t } from './common.ts';
import { Authority } from './m.Authority/mod.ts';
import { Capability } from './m.Capability.ts';
import { Cmd } from './m.Cmd.ts';
import { Client } from './m.Client/mod.ts';
import { ContentRef } from './m.ContentRef/mod.ts';
import { Cursor } from './m.Cursor/mod.ts';
import { Policy } from './m.Policy.ts';

export type * from './t.ts';

/**
 * Bounded Files model, command grammar, content refs, and typed client adapters.
 */
export const Files: t.Files.Lib = {
  Authority,
  Capability,
  Cmd,
  Client,
  ContentRef,
  Cursor,
  Policy,
};
