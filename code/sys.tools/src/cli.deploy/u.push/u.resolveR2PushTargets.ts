import { Fs, Path, type t } from '../common.ts';
import { resolveBases } from '../u.endpoints/u.resolve.ts';
import { resolveStagingRoot } from '../u.staging/mod.ts';

type ResolveR2PushTargetsArgs = {
  cwd: t.StringDir;
  yaml: t.DeployTool.Config.EndpointYaml.Doc;
};

export async function resolveR2PushTargets(
  args: ResolveR2PushTargetsArgs,
): Promise<t.PushTargetPlan> {
  const provider = args.yaml.provider;
  if (!provider || provider.kind !== 'r2') {
    return { targets: [], missing: [], stats: { total: 0, missing: 0 } };
  }

  const bases = resolveBases(args.cwd, args.yaml);
  const sourceDir = bases.sourceBaseAbs as t.StringDir;
  const stagingRootRel = String(args.yaml.staging?.dir ?? '').trim() || '.';
  const stagingDir = resolveStagingRoot({ cwd: args.cwd, stagingRootRel });

  if (!(await Fs.exists(stagingDir))) {
    const missing = missingR2Target({ provider, sourceDir, stagingDir });
    return { targets: [], missing: [missing], stats: { total: 0, missing: 1 } };
  }

  return {
    targets: [
      {
        provider,
        sourceDir,
        stagingDir,
        domain: trimText(provider.readOrigin),
      },
    ],
    missing: [],
    stats: { total: 1, missing: 0 },
  };
}

function missingR2Target(args: {
  provider: t.DeployTool.Config.Provider.R2;
  sourceDir: t.StringDir;
  stagingDir: t.StringDir;
}): t.PushMissingTarget {
  return {
    reason: 'missing-staging-output',
    provider: 'r2',
    sourceDir: args.sourceDir,
    stagingDir: Path.resolve(args.stagingDir, '.') as t.StringDir,
    domain: trimText(args.provider.readOrigin),
    bucket: trimText(args.provider.bucket),
    prefix: trimText(args.provider.prefix),
  };
}

function trimText(input: unknown): string | undefined {
  const text = String(input ?? '').trim();
  return text || undefined;
}
