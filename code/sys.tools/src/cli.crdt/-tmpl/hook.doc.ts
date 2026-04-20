import type * as t from 'jsr:@sys/tools/t';

import { c } from 'jsr:@sys/cli';
import { env } from 'jsr:@sys/tools/env';
import { Str } from 'jsr:@sys/std/str';
import { Obj } from 'jsr:@sys/std/value';

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
  const root = `${e.root.slice(0, -5)}${c.green(e.root.slice(-5))}`;
  console.info('\n', c.cyan(`⚡️onDag:`), c.gray(root));
  console.info(dag, '\n');
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
  // 🐷
  if (e.is.root) e.log(`hook: from root document 👋 | ${c.green(e.id)}`);
};

/**
 * Plugin extensions (eg. lint tasks).
 */
export const plugins: t.CrdtTool.Doc.Graph.Plugin[] = [
  {
    id: 'sample',
    title: `sample ${c.gray('(plugin)')}`,
    async run(e) {
      // 🐷
      const docpath = `/${Str.trimSlashes((e.docpath ?? []).join('/'))}`;
      console.info('\n', c.cyan('👋 plugin:sample'), c.gray(`| docpath: ${docpath}`), '\n');
      return { kind: 'stay' };
    },
  },
];
