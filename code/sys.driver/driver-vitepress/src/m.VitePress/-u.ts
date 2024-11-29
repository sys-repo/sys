import { type t, expect, slug, Testing } from '../-test.ts';
import { Fs } from './common.ts';

export const SAMPLE = {
  PATH: {
    sample: Fs.resolve('./src/-test/vitepress.sample-1'),
  },

  createPkg(): t.Pkg {
    return { name: `@sample/${slug()}`, version: '0.1.2' };
  },

  init(options: { slug?: boolean } = {}) {
    const port = Testing.randomPort();
    let path = `./.tmp/tests`;
    if (options.slug ?? true) path = Fs.join(path, slug());

    const inDir = Fs.resolve(path);
    const outDir = Fs.resolve(path, '.vitepress/dist');

    return {
      path,
      port,
      inDir,
      outDir,
      async ls() {
        const ls = await Fs.glob(inDir).find('**');
        return ls.map((m) => m.path);
      },
    } as const;
  },
} as const;

/**
 * Assert the given path exists.
 */
export const assertExists = async (path: t.StringPath, expected = true) => {
  expect(await Fs.exists(path)).to.eql(expected, path);
};

/**
 * Assert all the standard environment paths exists in the given directory.
 */
export const assertEnvExists = async (dir: t.StringDir, expected = true) => {
  const assert = (path: string) => assertExists(Fs.join(dir, path), expected);
  await assert('.vscode/settings.json');
  await assert('.gitignore');
  await assert('.vitepress/config.ts');
  await assert('.sys/-main.ts');
  await assert('deno.json');
  await assert('package.json');
  await assert('pkg.ts');
  await assert('docs/index.md');
};
