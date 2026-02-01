import { CrdtTool } from './t.namespace.ts';
export * from '../common.ts';

/**
 * Libs:
 */
export { A, Crdt, toAutomergeHandle } from '@sys/driver-automerge/fs';
export { Immutable } from '@sys/immutable/rfc6902';

/**
 * Constants:
 */
const id = CrdtTool.ID;
const name = CrdtTool.NAME;
export const D = {
  tool: { id, name },
  Path: {
    Repo: {
      daemon: './.repo/daemon.crdt',
      syncserver: './.repo/syncserver.crdt',
    },
  },
  Hook: {
    filename: 'hook.ts',
    Doc: { filename: 'hook.doc.ts' },
  },
} as const;
