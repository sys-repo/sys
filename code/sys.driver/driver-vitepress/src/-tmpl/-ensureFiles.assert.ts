import { type t, expect } from '../-test.ts';
import { Fs } from './common.ts';
export { SAMPLE } from '../m.VitePress/-u.ts';

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
  const paths = [
    'deno.json',
    'package.json',
    '.vscode/settings.json',
    '.gitignore',
    '.vitepress/config.ts',
    '.vitepress/theme/index.ts',
    '.sys/-main.ts',
    '.sys/components/index.ts',
    '.sys/components/Video.vue',
    '.sys/components/Video.tsx',
    '.sys/components/React.setup.ts',
    '.sys/components/React.Wrapper.vue',
    '.sys/components/React.Wrapper.Sample.tsx',
    'src/nav.ts',
    'src/components/index.ts',
    'src/components/Sample.vue',
    'docs/index.md',
  ];

  await Promise.all(paths.map((path) => assert(path)));
};
