import { type t } from '../common.ts';
export * from '../common.ts';

/**
 * Libs:
 */
export { A, Crdt, toAutomergeHandle } from '@sys/driver-automerge/fs';
export { Immutable } from '@sys/immutable/rfc6902';

/**
 * Constants:
 */
const id = 'crdt' satisfies t.CrdtTool.Id;
const name = 'system/crdt:tools' satisfies t.CrdtTool.Name;
export const D = {
  tool: { id, name },
  port: { repo: 49494, sync: 3030 },
  Sync: { server: 'waiheke.sync.db.team' },
  Path: {
    Repo: {
      daemon: './.repo/daemon.crdt',
      syncserver: './.repo/syncserver.crdt',
    },
  },
  Config: {
    filename: '-crdt.config.json',
    doc: {
      '.meta': { createdAt: 0 },
      version: '1.0.0',
      repo: { daemon: { sync: { websockets: [] } } },
    } satisfies t.CrdtTool.Config.Doc,
  },
  Hook: { filename: 'hook.ts' },
} as const;
