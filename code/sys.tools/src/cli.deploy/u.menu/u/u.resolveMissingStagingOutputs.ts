import { type t, Is, Path, Pkg } from './common.ts';
import { resolveMappingsForStaging } from './u.resolveMappingsForStaging.ts';
import { resolvePushStagingDir } from './u.resolvePushStagingDir.ts';

/**
 * Resolve mapping output names whose staging dirs do not have dist metadata yet.
 */
export async function resolveMissingStagingOutputs(args: {
  cwd: t.StringDir;
  yamlPath: t.StringRelativeDir;
  yaml: t.DeployTool.Config.EndpointYaml.Doc;
}): Promise<readonly string[]> {
  const resolved = await resolveMappingsForStaging(args);
  if (!resolved.ok) return [];

  const stagingRootRel = String(args.yaml.staging?.dir ?? '').trim() || '.';
  const stagingRootAbs = resolvePushStagingDir({ cwd: args.cwd, stagingRootRel });
  const missing: string[] = [];

  for (const mapping of resolved.mappings) {
    const stagingRel = String(mapping.dir.staging ?? '').trim() || '.';
    const stagingAbs = Path.resolve(stagingRootAbs, stagingRel);
    const dist = (await Pkg.Dist.load(stagingAbs)).dist;
    const hasDigest = Is.str(dist?.hash?.digest) && dist.hash.digest.trim().length > 0;
    if (!hasDigest) missing.push(formatMissingName(stagingRel));
  }

  return missing;
}

function formatMissingName(input: string): string {
  const value = String(input ?? '').trim() || '.';
  if (value === '.') return '.';
  return String(value).replace(/^\.\//, '');
}
