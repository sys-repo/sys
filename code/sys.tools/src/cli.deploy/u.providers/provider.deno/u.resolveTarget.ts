import { resolveBases, resolvePath } from '../../u.endpoints/u.resolve.ts';
import { type t, Path } from '../../common.ts';
import { resolvePushStagingDir } from '../../u.menu/u/u.resolvePushStagingDir.ts';

export type ResolveDenoTargetResult =
  | {
      readonly ok: true;
      readonly provider: t.DeployTool.Config.Provider.Deno;
      readonly targetDir: t.StringDir;
      readonly sourceRootAbs: t.StringDir;
      readonly stagingRootAbs: t.StringDir;
      readonly clear: boolean;
    }
  | {
      readonly ok: false;
      readonly reason: 'not-deno' | 'missing-mapping';
      readonly hint: string;
    };

/**
 * Resolve the selected Deno package target and caller-owned stage root from endpoint YAML.
 */
export function resolveTarget(args: {
  cwd: t.StringDir;
  yaml: t.DeployTool.Config.EndpointYaml.Doc;
}): ResolveDenoTargetResult {
  const provider = args.yaml.provider;
  if (!provider || provider.kind !== 'deno') {
    return {
      ok: false,
      reason: 'not-deno',
      hint: 'Deno target resolution requires a deno provider.',
    };
  }

  const mapping = args.yaml.mapping;
  if (!mapping) {
    return {
      ok: false,
      reason: 'missing-mapping',
      hint: 'Deno endpoints need a singular mapping to select the package target.',
    };
  }

  const bases = resolveBases(args.cwd, args.yaml);
  const targetDir = resolvePath(bases.sourceBaseAbs, mapping.dir.source) as t.StringDir;
  const sourceRootAbs = Path.resolve(bases.sourceBaseAbs, '.') as t.StringDir;
  const stagingRootAbs = resolvePushStagingDir({
    cwd: args.cwd,
    stagingRootRel: String(args.yaml.staging?.dir ?? '').trim() || '.',
  });

  return {
    ok: true,
    provider,
    targetDir,
    sourceRootAbs,
    stagingRootAbs,
    clear: args.yaml.staging?.clear === true,
  };
}
