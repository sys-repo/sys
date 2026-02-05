import { type t, Fs, pkg } from './common.ts';
import { YamlConfig } from '@sys/yaml/cli';

/**
 * Migrate pkg-scoped lint profiles into the flattened package root.
 */
export async function migrate01(cwd: t.StringDir): Promise<t.YamlConfig.Migrate.DirResult> {
  const legacyDir = `-config/${pkg.name}/lint`;
  const root = YamlConfig.File.fromPkg('-config', pkg).dir.name;
  const targetDir = `-config/${root}/lint`;

  const result = await YamlConfig.File.migrateDir({
    cwd,
    from: legacyDir,
    to: targetDir,
    ext: '.yaml',
  });

  await removeEmptyParents(cwd, legacyDir, '@tdb');
  return result;
}

async function removeEmptyParents(cwd: t.StringDir, start: t.StringPath, stopAt: string) {
  let current = Fs.dirname(Fs.join(cwd, start));
  while (true) {
    if (!(await Fs.exists(current))) break;
    const remaining = await countDirEntries(current);
    if (remaining > 0) break;
    await Fs.remove(current);
    if (Fs.basename(current) === stopAt) break;
    current = Fs.dirname(current);
  }
}

async function countDirEntries(dir: t.StringDir): Promise<number> {
  let count = 0;
  for await (const entry of Deno.readDir(dir)) {
    if (entry) count++;
  }
  return count;
}
