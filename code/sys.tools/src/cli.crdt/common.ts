import { type t, JsonFile, Fs } from '../common.ts';

export * from '../common.ts';

/**
 * Libs:
 */
export { Crdt } from '@sys/driver-automerge/fs';
export { Immutable } from '@sys/immutable/rfc6902';

/**
 * Constants:
 */
export const D = {
  toolname: 'CRDT Tools',
  Sync: { server: 'waiheke.sync.db.team' },
  Path: {
    repo: './.crdt.repo',
    config: './tools.config.json',
  },
  config: {
    filename: 'crdt.config.json',
    doc: { '.meta': { createdAt: 0 }, version: '1.0.0' } satisfies t.CrdtConfigDoc,
  },
} as const;

/**
 * Retrieval of the stateful config-file.
 */
export async function getConfig(dir: t.StringDir) {
  const path = Fs.join(dir, D.config.filename);
  return JsonFile.Singleton.get<t.CrdtConfigDoc>(path, D.config.doc, { touch: true });
}
