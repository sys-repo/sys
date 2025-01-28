import { type t, Fs, slug } from './common.ts';
import * as sample1 from './sample-1/mod.ts';

export const SAMPLE = {
  sample1,

  fs(dirname: string, options: { slug?: boolean } = {}) {
    const dir = Fs.resolve(`./.tmp/tests/${dirname}`, options.slug ?? true ? slug() : '');
    const exists = (dir: t.StringDir, path: string[]) => Fs.exists(Fs.join(dir, ...path));
    const api = {
      dir,
      exists: (...path: string[]) => exists(dir, path),
      async ls(trimRoot?: boolean) {
        const paths = await Fs.ls(dir);
        return trimRoot ? paths.map((p) => p.slice(dir.length)) : paths;
      },
      async init() {
        await Fs.ensureDir(dir);
        return api;
      },
    } as const;
    return api;
  },
} as const;
