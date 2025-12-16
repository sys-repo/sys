import { type t, Fs, JsonFile } from '../common.ts';

/**
 * Get or create the `-<name>.config.json` file.
 * Always normalize the config relative to `dir` on load (portable storage).
 */
export async function getConfig(dir: t.StringDir): Promise<t.ServeTool.Config.File> {
  // Dynamic imports to prevent circular refs.
  const { D } = await import('./common.ts');
  const { normalize } = await import('./u.config.normalize.ts');

  type Doc = t.ServeTool.Config.Doc;
  const path = Fs.join(dir, D.Config.filename);
  const doc = await JsonFile.Singleton.get<Doc>(path, D.Config.doc, { touch: true });

  // Normalize on load so call-sites can assume canonical storage.
  await normalize(doc, dir);

  return doc;
}
