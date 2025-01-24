import { init } from 'rambda';
import { type t, Fs, slug } from '../common.ts';

export const SAMPLE = {
  pkg: { name: '@sys/std', version: '0.0.42' },

  // NB: paths not-ordered.
  def: {
    '/src/m.Path/mod.ts': {
      size: 261,
      checksum: 'sha256-03d38aeb62a14d34da9f576d12454537d4c6cedff0ad80d9ee4b9b8bb77702ba',
    },
    '/src/pkg.ts': {
      size: 241,
      checksum: 'sha256-b79790c447397a88ace8c538792fa37742ea38306cd08676947a2cd026b66269',
    },
    '/deno.json': {
      size: 830,
      checksum: 'sha256-dd9c3b367d8745aef1083b94982689dc7b39c75e16d8da66c78da6450166f3d5',
    },
  },

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
