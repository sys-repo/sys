import { type t, Fs, JsonFile } from '../common.ts';

/**
 * Get or create the `crdt.config.json` file.
 */
export async function getConfig(dir: t.StringDir): Promise<t.CrdtConfig> {
  // Dynamic imports to prevert circular refs.
  const { D } = (await import('./common.ts')) satisfies typeof import('./common.ts');

  /**
   * Get or create the config-file.
   */
  const path = Fs.join(dir, D.Config.filename);
  const doc = JsonFile.Singleton.get<t.CrdtConfigDoc>(path, D.Config.doc, { touch: true });
  return doc;
}
