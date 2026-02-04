import { includesShardTemplate, resolveShardTemplate } from '../../u.shardTemplate.ts';
import { type t, c, Fs, Is, Obj, Path } from './common.ts';
import { resolvePushStagingDir } from './u.resolvePushStagingDir.ts';

export type PushTarget = {
  readonly provider: t.DeployTool.Config.Provider.Orbiter;
  readonly stagingDir: t.StringDir;
  readonly shard?: number;
  readonly domain?: string;
};

export async function resolvePushTargets(args: {
  cwd: t.StringDir;
  yaml: t.DeployTool.Config.EndpointYaml.Doc;
}): Promise<readonly PushTarget[]> {
  const provider = args.yaml.provider;
  if (!provider || provider.kind !== 'orbiter') return [];
  const baseDomain = String(provider.domain ?? '').trim();

  const mappings = args.yaml.mappings ?? [];
  const stagingRootRel = String(args.yaml.staging?.dir ?? '').trim() || '.';
  const stagingRootAbs = resolvePushStagingDir({ cwd: args.cwd, stagingRootRel });

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
    const msg = 'Deploy: multiple index mappings found; using the first for root push.';
    console.info(c.yellow(msg));
  }

  if (shardMappings.length === 0) {
    if (!(await Fs.exists(stagingRootAbs))) return [];
    return [{ provider, stagingDir: stagingRootAbs }];
  }

  const targets: PushTarget[] = [];
  const seen = new Set<string>();

  for (const mapping of baseMappings) {
    const stagingRel = String(mapping.dir.staging ?? '').trim() || '.';
    const stagingAbs = Path.resolve(stagingRootAbs, stagingRel);
    if (!(await Fs.exists(stagingAbs))) continue;
    if (seen.has(stagingAbs)) continue;
    seen.add(stagingAbs);
    targets.push({ provider, stagingDir: stagingAbs });
  }

  const indexMapping = indexMappings[0];
  if (indexMapping) {
    const stagingRel = String(indexMapping.dir.staging ?? '').trim() || '.';
    const stagingAbs = Path.resolve(stagingRootAbs, stagingRel);
    if (await Fs.exists(stagingAbs)) {
      if (!seen.has(stagingAbs)) {
        seen.add(stagingAbs);
        targets.push({ provider, stagingDir: stagingAbs });
      }
    }
  }

  const shardConfig = provider.shards;
  const siteIds = shardConfig?.siteIds;
  const total = shardConfig?.total;
  if (!Is.num(total) || !Number.isFinite(total) || total <= 0) return targets;
  if (!siteIds || Obj.keys(siteIds).length === 0) return targets;

  const only = shardConfig?.only ?? [];
  const indices =
    only.length > 0 ? only : Obj.keys(siteIds).map((key) => Number.parseInt(String(key), 10));

  for (const shard of indices) {
    if (!Is.num(shard) || !Number.isInteger(shard)) continue;
    if (shard < 0 || shard >= total) continue;
    const siteId = siteIds[shard];
    if (!Is.str(siteId) || !siteId.trim()) continue;

    for (const mapping of shardMappings) {
      const stagingRel = String(mapping.dir.staging ?? '').trim() || '.';
      const expandedRel = resolveShardTemplate(stagingRel, shard, total);
      const stagingAbs = Path.resolve(stagingRootAbs, expandedRel);
      if (!(await Fs.exists(stagingAbs))) continue;
      const providerForShard = { ...provider, siteId };
      const shardDomain = baseDomain ? `${shard}.${baseDomain}` : undefined;
      targets.push({
        provider: providerForShard,
        stagingDir: stagingAbs,
        domain: shardDomain,
        shard,
      });
    }
  }

  return targets;
}
