import { type t, Fs, JsonFile } from '../common.ts';

export * from '../common.ts';

/**
 * Libs:
 */
export { Crdt, toAutomergeHandle, A } from '@sys/driver-automerge/fs';
export { Immutable } from '@sys/immutable/rfc6902';

/**
 * Constants:
 */
export const D = {
  toolname: `system/crdt:tools`,
  Sync: { server: 'waiheke.sync.db.team' },
  Path: {
    repo: './.repo.crdt',
    config: './tools.config.json',
  },
  config: {
    filename: 'crdt.config.json',
    doc: { '.meta': { createdAt: 0 }, version: '1.0.0' } satisfies t.CrdtConfigDoc,
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
