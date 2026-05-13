import { Fs, Is, Obj, Path, type t } from '../common.ts';
import { resolveBases } from '../u.endpoints/u.resolve.ts';
import { includesShardTemplate, resolveShardTemplate } from '../u.shardTemplate.ts';
import { resolveStagingRoot } from '../u.staging/mod.ts';

type ResolveOrbiterPushTargetsArgs = {
  cwd: t.StringDir;
  yaml: t.DeployTool.Config.EndpointYaml.Doc;
  onMultipleIndexMappings?: (message: string) => void;
};

export async function resolveOrbiterPushTargets(
  args: ResolveOrbiterPushTargetsArgs,
): Promise<t.OrbiterPushTargetPlan> {
  const provider = args.yaml.provider;
  if (!provider || provider.kind !== 'orbiter') {
    return {
      targets: [],
      missing: [],
      stats: { total: 0, shard: 0, root: 0, base: 0, skippedShards: 0, missing: 0 },
    };
  }
  const baseDomain = String(provider.domain ?? '').trim();
  const bases = resolveBases(args.cwd, args.yaml);
  const sourceDir = bases.sourceBaseAbs as t.StringDir;

  const mappings = args.yaml.mappings ?? [];
  const stagingRootRel = String(args.yaml.staging?.dir ?? '').trim() || '.';
  const stagingRootAbs = resolveStagingRoot({ cwd: args.cwd, stagingRootRel });

  const shardMappings: t.DeployTool.Config.EndpointYaml.Mapping[] = [];
  const baseMappings: t.DeployTool.Config.EndpointYaml.Mapping[] = [];
  const indexMappings: t.DeployTool.Config.EndpointYaml.Mapping[] = [];

  for (const mapping of mappings) {
    if (mapping.mode === 'index') {
      indexMappings.push(mapping);
      continue;
    }
    const source = String(mapping.dir.source ?? '').trim();
    const staging = String(mapping.dir.staging ?? '').trim();
    const hasTemplate = includesShardTemplate(source) || includesShardTemplate(staging);
    if (hasTemplate) shardMappings.push(mapping);
    else baseMappings.push(mapping);
  }

  if (indexMappings.length > 1) {
    args.onMultipleIndexMappings?.(
      'Deploy: multiple index mappings found; using the first for root push.',
    );
  }

  const missing: t.PushMissingTarget[] = [];
  const missingSeen = new Set<string>();

  if (shardMappings.length === 0) {
    if (!(await Fs.exists(stagingRootAbs))) {
      addMissingTarget(
        missing,
        missingSeen,
        missingOrbiterTarget({ provider, sourceDir, stagingDir: stagingRootAbs }),
      );
      return {
        targets: [],
        missing,
        stats: { total: 0, shard: 0, root: 0, base: 0, skippedShards: 0, missing: missing.length },
      };
    }
    return {
      targets: [{ provider, sourceDir, stagingDir: stagingRootAbs }],
      missing,
      stats: { total: 1, shard: 0, root: 0, base: 1, skippedShards: 0, missing: 0 },
    };
  }

  const targets: t.OrbiterPushTarget[] = [];
  const seen = new Set<string>();
  let skippedShards = 0;

  for (const mapping of baseMappings) {
    const stagingRel = String(mapping.dir.staging ?? '').trim() || '.';
    const stagingAbs = Path.resolve(stagingRootAbs, stagingRel);
    if (!(await Fs.exists(stagingAbs))) {
      addMissingTarget(
        missing,
        missingSeen,
        missingOrbiterTarget({ provider, sourceDir, stagingDir: stagingAbs }),
      );
      continue;
    }
    if (seen.has(stagingAbs)) continue;
    seen.add(stagingAbs);
    targets.push({ provider, sourceDir, stagingDir: stagingAbs });
  }

  const indexMapping = indexMappings[0];
  if (indexMapping) {
    const stagingRel = String(indexMapping.dir.staging ?? '').trim() || '.';
    const stagingAbs = Path.resolve(stagingRootAbs, stagingRel);
    if (await Fs.exists(stagingAbs)) {
      if (!seen.has(stagingAbs)) {
        seen.add(stagingAbs);
        targets.push({ provider, sourceDir, stagingDir: stagingAbs });
      }
    } else {
      addMissingTarget(
        missing,
        missingSeen,
        missingOrbiterTarget({ provider, sourceDir, stagingDir: stagingAbs }),
      );
    }
  }

  const shardConfig = provider.shards;
  const siteIds = shardConfig?.siteIds;
  const total = shardConfig?.total;
  if (!Is.num(total) || !Number.isFinite(total) || total <= 0) {
    const rootCount = indexMapping ? 1 : 0;
    return {
      targets,
      missing,
      stats: {
        total: targets.length,
        shard: 0,
        root: rootCount,
        base: Math.max(0, targets.length - rootCount),
        skippedShards,
        missing: missing.length,
      },
    };
  }
  if (!siteIds || Obj.keys(siteIds).length === 0) {
    const rootCount = indexMapping ? 1 : 0;
    return {
      targets,
      missing,
      stats: {
        total: targets.length,
        shard: 0,
        root: rootCount,
        base: Math.max(0, targets.length - rootCount),
        skippedShards,
        missing: missing.length,
      },
    };
  }

  const only = shardConfig?.only ?? [];
  const indices = only.length > 0
    ? only
    : Obj.keys(siteIds).map((key) => Number.parseInt(String(key), 10));

  for (const shard of indices) {
    if (!Is.num(shard) || !Number.isInteger(shard)) continue;
    if (shard < 0 || shard >= total) continue;
    const siteId = siteIds[shard];
    if (!Is.str(siteId) || !siteId.trim()) continue;

    let hasShardOutput = false;
    for (const mapping of shardMappings) {
      const stagingRel = String(mapping.dir.staging ?? '').trim() || '.';
      const expandedRel = resolveShardTemplate(stagingRel, shard, total);
      const stagingAbs = Path.resolve(stagingRootAbs, expandedRel);
      if (!(await Fs.exists(stagingAbs))) {
        addMissingTarget(
          missing,
          missingSeen,
          missingOrbiterTarget({
            provider,
            sourceDir,
            stagingDir: stagingAbs,
            shard,
            domain: baseDomain ? `${shard}.${baseDomain}` : undefined,
            siteId,
          }),
        );
        continue;
      }
      hasShardOutput = true;
      const providerForShard = { ...provider, siteId };
      const shardDomain = baseDomain ? `${shard}.${baseDomain}` : undefined;
      targets.push({
        provider: providerForShard,
        sourceDir,
        stagingDir: stagingAbs,
        domain: shardDomain,
        shard,
      });
    }
    if (!hasShardOutput) skippedShards += 1;
  }

  const shardCount = targets.filter((target) => Is.num(target.shard)).length;
  const baseCount = targets.filter((target) => !Is.num(target.shard)).length;
  const rootCount = indexMapping ? 1 : 0;
  return {
    targets,
    missing,
    stats: {
      total: targets.length,
      shard: shardCount,
      root: rootCount,
      base: Math.max(0, baseCount - rootCount),
      skippedShards,
      missing: missing.length,
    },
  };
}

function addMissingTarget(
  missing: t.PushMissingTarget[],
  seen: Set<string>,
  target: t.PushMissingTarget,
) {
  const key = [
    target.provider,
    target.reason,
    target.stagingDir ?? '',
    target.shard ?? '',
    target.siteId ?? '',
  ].join('\u0000');
  if (seen.has(key)) return;
  seen.add(key);
  missing.push(target);
}

function missingOrbiterTarget(args: {
  provider: t.DeployTool.Config.Provider.Orbiter;
  sourceDir: t.StringDir;
  stagingDir: t.StringDir;
  shard?: number;
  domain?: string;
  siteId?: string;
}): t.PushMissingTarget {
  return {
    reason: 'missing-staging-output',
    provider: 'orbiter',
    sourceDir: args.sourceDir,
    stagingDir: args.stagingDir,
    shard: Is.num(args.shard) ? args.shard : undefined,
    domain: trimText(args.domain ?? args.provider.domain),
    siteId: trimText(args.siteId ?? args.provider.siteId),
  };
}

function trimText(input: unknown): string | undefined {
  const text = String(input ?? '').trim();
  return text || undefined;
}
