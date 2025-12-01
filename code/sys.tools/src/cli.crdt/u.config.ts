import { type t, D, Is, Time, getConfig, Obj } from './common.ts';

export { getConfig };

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
