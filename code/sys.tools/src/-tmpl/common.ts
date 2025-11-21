import { type t, Fs, JsonFile } from '../common.ts';

export * from '../common.ts';

/**
 * Libs:
 */

/**
 * Constants:
 */
export const D = {
  toolname: `__NAME__`,
  Path: {},
  config: {
    filename: '__NAME__.config.json',
    doc: JsonFile.default<t.__NAME__ConfigDoc>({ version: '1.0.0' }),
  },
} as const;

/**
 * Get or create the `config.json` file.
 */
export async function getConfig(dir: t.StringDir): Promise<t.__NAME__Config> {
  const path = Fs.join(dir, D.config.filename);
  const doc = JsonFile.Singleton.get<t.__NAME__ConfigDoc>(path, D.config.doc, { touch: true });
  return doc;
}
