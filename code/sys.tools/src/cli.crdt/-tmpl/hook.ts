import { env } from 'jsr:@sys/tools/env';
import { c, Cli } from 'jsr:@sys/cli';
import { Obj, Arr, Str, Num, Is } from 'jsr:@sys/std';
import type { t } from 'jsr:@sys/tools';

/** Ensure VSCode environment setup (need only run once). */
await env();

/**
 * DAG calculated hook.
 *
 * Called once for after the complete document DAG has been calculated.
 * Use this to perform operations on the complete document graph via CRDT commands.
 */
export const onDag: t.CrdtTool.Doc.Graph.DagHook = async (e) => {
  const { cmd, dag } = e;

  // 🐷
  console.info();
  console.info(c.cyan(`⚡️onDag:`), c.gray(`${e.root.slice(0, -5)}${c.green(e.root.slice(-5))}`));
  console.info();
  console.info(dag);
  console.info();
};

/**
 * Graph-walk document hook.
 *
 * Called once for every document encountered during a DAG walk.
 * Use this to inspect, validate, or mutate documents via CRDT commands.
 */
export const onWalk: t.CrdtTool.Doc.Graph.WalkHook = async (e) => {
  const { cmd } = e;
  const current = e.doc.current;

  // 🐷 ↓ perform actions on each document in the graph here.
  if (e.is.root) {
    e.log(`hook: from root document 👋 | ${c.green(e.id)}`);
  }
};
