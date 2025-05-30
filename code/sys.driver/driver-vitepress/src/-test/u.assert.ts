import { type t, expect, Time } from '../-test.ts';
import { Fs } from '../common.ts';

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
    '.vitepress/config.markdown.ts',
    '.vitepress/theme/index.ts',
    '.sys/components/index.ts',
    '.sys/components/Video.vue',
    '.sys/components/Video.tsx',
    '.sys/components/React.setup.ts',
    '.sys/components/React.Wrapper.vue',
    '.sys/components/React.Wrapper.Sample.tsx',
    'src/nav.ts',
    'src/config.ts',
    'docs/index.md',
  ];

  await Time.wait(0); // NB: (resilience) ensure test files have fully finished writing to the file-system.
  await Promise.all(paths.map((path) => assert(path)));
};
