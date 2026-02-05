import { type t, pkg } from '../common.ts';
import { YamlConfig } from '@sys/yaml/cli';
import { ServeFs } from './u.fs.ts';

/**
 * Migrate pkg-scoped serve YAMLs into the flattened package root.
 */
export async function migrate01(
  cwd: t.StringDir,
): Promise<t.YamlConfig.Migrate.DirResult> {
  const legacyDir = `-config/${pkg.name}/serve`;
  const root = YamlConfig.File.fromPkg('-config', pkg).dir.name;
  const targetDir = `-config/${root}.serve`;

  return await YamlConfig.File.migrateDir({
    cwd,
    from: legacyDir,
    to: targetDir,
    ext: ServeFs.ext,
  });
}
