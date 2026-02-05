import { type t, pkg } from '../common.ts';
import { YamlConfig } from '@sys/yaml/cli';
import { CrdtDocsFs } from './u.fs.ts';

/**
 * Migrate pkg-scoped doc YAMLs into the flattened package root.
 */
export async function migrate01(cwd: t.StringDir): Promise<t.YamlConfig.Migrate.DirResult> {
  const legacyDir = `-config/${pkg.name}/crdt/docs`;
  const root = YamlConfig.File.fromPkg('-config', pkg).dir.name;
  const targetDir = `-config/${root}.crdt.docs`;

  return await YamlConfig.File.migrateDir({
    cwd,
    from: legacyDir,
    to: targetDir,
    ext: CrdtDocsFs.ext,
  });
}
