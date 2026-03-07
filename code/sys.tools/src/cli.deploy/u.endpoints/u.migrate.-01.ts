import { YamlConfig } from '@sys/yaml/cli';
import { type t, pkg } from '../common.ts';
import { EndpointsFs } from './u.fs.ts';

/**
 * Migrate pkg-scoped endpoint YAMLs into the flattened package root.
 */
export async function migrate01(cwd: t.StringDir): Promise<t.YamlConfig.Migrate.DirResult> {
  const legacyDir = `-config/${pkg.name}/deploy`;
  const root = YamlConfig.File.fromPkg('-config', pkg).dir.name;
  const targetDir = `-config/${root}.deploy`;

  return await YamlConfig.File.migrateDir({
    cwd,
    from: legacyDir,
    to: targetDir,
    ext: EndpointsFs.ext,
  });
}
