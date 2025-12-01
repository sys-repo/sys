import { env } from 'jsr:@sys/tools/env';
import { c, Cli } from 'jsr:@sys/cli';
import { Obj, Arr, Str, Num, Is } from 'jsr:@sys/std';
import { type t } from 'jsr:@sys/tools';

/**
 * Graph-walk document hook.
 *
 * Called once for every document encountered during a DAG walk.
 * Use this to inspect, validate, or mutate documents via CRDT commands.
 */
export const onDoc: t.DocumentGraphHook = async (e) => {
  const { cmd } = e;
  const current = e.doc.current;

  // 🐷 ↓ perform actions on each document in the graph here.
  if (e.is.root) {
    e.log(`hook: from root document 👋 | ${c.green(e.id)}`);
  }
};
