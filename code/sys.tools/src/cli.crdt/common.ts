import { type t } from '../common.ts';

export * from '../common.ts';
export { getConfig } from './u.configfile.ts';

/**
 * Libs:
 */
export { A, Crdt, toAutomergeHandle } from '@sys/driver-automerge/fs';
export { Immutable } from '@sys/immutable/rfc6902';
export { Yaml } from '@sys/yaml';

/**
 * Constants:
 */
export const D = {
  toolname: `system/crdt:tools`,
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
    } satisfies t.CrdtConfigDoc,
  },
  Hook: { filename: 'hook.ts' },
} as const;
