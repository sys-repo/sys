import { type t, Fs } from './common.ts';
import { Tmpl } from './u.tmpl.ts';

/**
 * Ensure the required configuration files exist within
 * the given directory.
 */
export async function ensureFiles(dir: t.StringDir) {
  dir = Fs.Is.absolute(dir) ? dir : Fs.resolve(dir);

  const ensure = async (tmpl: string, target: t.StringPath) => {
    target = Fs.join(dir, target);
    if (await Fs.exists(target)) return;
    await Fs.ensureDir(Fs.dirname(target));
    await Deno.writeTextFile(target, tmpl);
  };

  await ensure(Tmpl.gitignore, '.vitepress/.gitignore');
  await ensure(Tmpl.config, '.vitepress/config.ts');
}
