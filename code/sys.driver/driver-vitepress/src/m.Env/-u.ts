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
  await assert('.vscode/settings.json');
  await assert('.gitignore');
  await assert('.vitepress/config.ts');
  await assert('.vitepress/theme/index.ts');
  await assert('.sys/-main.ts');
  await assert('.sys/components/index.ts');
  await assert('.sys/components/VideoPlayer.vue');
  await assert('deno.json');
  await assert('package.json');
  await assert('src/nav.ts');
  await assert('src/components/index.ts');
  await assert('src/components/Sample.vue');
  await assert('docs/index.md');
};
