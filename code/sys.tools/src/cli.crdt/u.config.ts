import { type t, D, Fs, Is, JsonFile, Obj, Time } from './common.ts';

/**
 * Config file helpers.
 */
export const Config = {
  get: getConfig,
  normalize,
} as const;

/**
 * Get or create the `-crdt.config.json` file.
 */
export async function getConfig(dir: t.StringDir): Promise<t.CrdtTool.Config> {
  const path = Fs.join(dir, D.Config.filename);
  const doc = JsonFile.Singleton.get<t.CrdtTool.ConfigDoc>(path, D.Config.doc, { touch: true });
  return doc;
}

/**
 * Perform migrations and other maintenance on the config-file data structure.
 */
export async function normalize(config: t.CrdtTool.Config) {
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
