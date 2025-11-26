import { type t, Time, getConfig } from './common.ts';

export { getConfig };

export async function normalize(config: t.CrdtConfig) {
  /**
   * Ensure all items have a `createdAt` timestamp.
   */
  const docs = config.current.docs ?? [];
  if (docs.some((d) => d.createdAt === undefined)) {
    config.change((d) => {
      const docs = d.docs || (d.docs = []);
      const now = Time.now.timestamp;
      docs.filter((item) => item.createdAt == null).forEach((item) => (item.createdAt = now));
    });
  }

  /**
   * Save if changed
   */
  if (config.fs.pending) await config.fs.save();
}
