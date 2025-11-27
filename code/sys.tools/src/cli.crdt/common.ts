import { type t, Fs, JsonFile } from '../common.ts';

export * from '../common.ts';

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
  port: {
    repo: 49494,
    sync: 3030,
  },
  Sync: { server: 'waiheke.sync.db.team' },
  Path: {
    config: './tools.config.json',
    Repo: {
      daemon: './.repo/daemon.crdt',
      syncserver: './.repo/syncserver.crdt',
    },
  },
  config: {
    filename: '-crdt.config.json',
    doc: {
      '.meta': { createdAt: 0 },
      version: '1.0.0',
      repo: { daemon: { sync: { websockets: [] } } },
    } satisfies t.CrdtConfigDoc,
  },
} as const;

/**
 * Get or create the `crdt.config.json` file.
 */
export async function getConfig(dir: t.StringDir): Promise<t.CrdtConfig> {
  const path = Fs.join(dir, D.config.filename);
  const doc = JsonFile.Singleton.get<t.CrdtConfigDoc>(path, D.config.doc, { touch: true });
  return doc;
}
