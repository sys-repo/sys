import { type t, Fs } from './common.ts';

/**
 * Ensure the required configuration files exist within
 * the given directory.
 */
export async function ensureFiles(dir: t.StringDir) {
  dir = Fs.Is.absolute(dir) ? dir : Fs.resolve(dir);
  const resolve = (...parts: string[]) => Fs.resolve(import.meta.dirname ?? '', ...parts);
  const ensure = async (source: t.StringPath, target: t.StringPath) => {
    target = Fs.join(dir, target);
    if (await Fs.exists(target)) return;
    await Fs.copy(resolve(source), target, { throw: true });
  };

  await ensure('../-tmpl/config.ts', '.vitepress/config.ts');
  await ensure('../-tmpl/.gitignore', '.vitepress/.gitignore');
}
