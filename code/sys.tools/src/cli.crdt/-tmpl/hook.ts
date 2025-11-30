import 'jsr:@sys/tools/env';
import { Obj, Str } from 'jsr:@sys/std';
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
    e.log('hook: root document 👋');
  }
};
