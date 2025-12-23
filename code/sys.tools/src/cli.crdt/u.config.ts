import { type t, Config as Base, D, Fs, Is, JsonFile, Obj, Time } from './common.ts';

/**
 * Config file helpers.
 */
export const Config = {
  ...Base,
  get,
  normalize,
  findDocEntry(config: t.CrdtTool.Config.Doc, docid: t.Crdt.Id) {
    const dirs = config.docs || (config.docs = []);
    return dirs.find((m) => m.id === docid);
  },
} as const;

/**
 * Get or create the `-<name>.config.json` file.
 */
async function get(cwd: t.StringDir): Promise<t.CrdtTool.Config.File> {
  const { filename, doc } = D.Config;
  return Base.get<t.CrdtTool.Config.Doc>(cwd, filename, doc);
}

/**
 * Perform migrations and other maintenance on the config-file data structure.
 */
export async function normalize(config: t.CrdtTool.Config.File) {
  const current = config.current;
  /**
   * Ensure all items have a `createdAt` timestamp.
   */
  const docs = current.docs ?? [];
  if (docs.some((d) => d.createdAt === undefined)) {
    config.change((d) => {
      const docs = d.docs || (d.docs = []);
      const now = Time.now.timestamp;
      docs.filter((item) => item.createdAt == null).forEach((item) => (item.createdAt = now));
    });
  }

  /**
   * Ensure the `config.repo` configuration exists.
   */
  if (!Is.record(current?.repo?.daemon)) {
    const DEF = D.Config.doc.repo;
    config.change((d) => {
      const repo = d.repo || (d.repo = Obj.clone(DEF));
      repo.daemon = repo.daemon || (repo.daemon = Obj.clone(DEF.daemon));
      repo.daemon.sync = repo.daemon.sync || (repo.daemon.sync = Obj.clone(DEF.daemon.sync));
    });
  }

  /**
   * Save if changed
   */
  if (config.fs.pending) await config.fs.save();
}
