import { typeByExtension } from 'jsr:@std/media-types@^1.1.0/type-by-extension';
import { type t, Fs, JsonFile } from '../common.ts';

export * from '../common.ts';
export { HttpServer, Net } from '@sys/http/server';

/**
 * Constants:
 */
const toolname = `system/serve:tools`;
export const D = {
  toolname,
  Path: {},
  config: {
    filename: '-serve.config.json',
    doc: JsonFile.default<t.ServeConfigDoc>({ name: toolname }),
  },
} as const;

/**
 * Get or create the `config.json` file.
 */
export async function getConfig(dir: t.StringDir): Promise<t.ServeConfig> {
  const path = Fs.join(dir, D.config.filename);
  const doc = JsonFile.Singleton.get<t.ServeConfigDoc>(path, D.config.doc, { touch: true });
  return doc;
}
