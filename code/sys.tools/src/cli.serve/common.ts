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
  mime: {
    images: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    videos: ['video/webm', 'video/mp4'],
    documents: ['application/pdf', 'application/json', 'application/yaml'],
    get extensionMap(): Record<string, string> {
      const extForMime: Record<string, readonly string[]> = {
        'image/png': ['png'],
        'image/jpeg': ['jpg', 'jpeg'],
        'image/webp': ['webp'],
        'image/svg+xml': ['svg'],
        'video/webm': ['webm'],
        'video/mp4': ['mp4'],
        'application/pdf': ['pdf'],
        'application/json': ['json'],
        'application/yaml': ['yaml', 'yml'],
      };
      const entries = Object.entries(extForMime);
      return Object.fromEntries(entries.flatMap(([mime, exts]) => exts.map((ext) => [ext, mime])));
    },
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
