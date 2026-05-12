import { Fs, Is, Path, type t } from '../common.ts';
import { resolveBases, resolvePath } from '../u.endpoints/u.resolve.ts';
import {
  expandShardTemplatePaths,
  includesShardTemplate,
  shouldRequireAllShards,
} from '../u.shardTemplate.ts';

type ResolveMappingsResult =
  | { readonly ok: true; readonly mappings: readonly t.DeployTool.Staging.Mapping[] }
  | { readonly ok: false; readonly mappings: readonly t.DeployTool.Staging.Mapping[] };

/**
 * Resolve endpoint mappings into concrete staging mappings.
 *
 * Returns ok:false when YAML read fails and no already-validated YAML is provided.
 */
export async function resolveMappingsForStaging(args: {
  readonly cwd: t.StringDir;
  readonly yamlPath: t.StringRelativeDir;
  readonly yaml?: t.DeployTool.Config.EndpointYaml.Doc;
}): Promise<ResolveMappingsResult> {
  const { cwd } = args;
  const yamlAbs = Path.resolve(cwd, args.yamlPath);

  const res = args.yaml
    ? { ok: true as const, data: args.yaml }
    : await Fs.readYaml<t.DeployTool.Config.EndpointYaml.Doc>(String(yamlAbs));

  const raw = res.ok ? res.data?.mappings ?? [] : [];
  const provider = res.ok ? res.data?.provider : undefined;
  const providerShards = provider?.kind === 'orbiter' ? provider.shards : undefined;
  const bases = res.ok ? resolveBases(cwd, res.data ?? {}) : undefined;
  const resolved: t.DeployTool.Staging.Mapping[] = [];

  for (const mapping of raw) {
    const expanded = await expandShardMappings(mapping, providerShards, bases);
    resolved.push(...expanded);
  }

  return res.ok ? { ok: true, mappings: resolved } : { ok: false, mappings: resolved };
}

async function expandShardMappings(
  mapping: t.DeployTool.Config.EndpointYaml.Mapping,
  providerShards: t.OrbiterProvider['shards'] | undefined,
  bases?: ReturnType<typeof resolveBases>,
): Promise<t.DeployTool.Staging.Mapping[]> {
  const source = String(mapping.dir.source ?? '').trim();
  const staging = String(mapping.dir.staging ?? '').trim();
  const shards = resolveShardConfig(mapping, providerShards);
  const expanded = expandShardTemplatePaths({
    source,
    staging,
    total: shards.total,
    requireAll: shards.requireAll,
  });

  const hasTemplate = includesShardTemplate(source) || includesShardTemplate(staging);
  const total = shards.total;
  const requireAll = shouldRequireAllShards({
    source,
    staging,
    total,
    requireAll: shards.requireAll,
  });

  if (
    !bases || !hasTemplate || requireAll || !Is.num(total) || !Number.isFinite(total) || total <= 0
  ) {
    return expanded.map((dir) => ({ mode: mapping.mode, dir }));
  }

  const filtered: t.DeployTool.Staging.Mapping[] = [];
  for (const dir of expanded) {
    const sourceAbs = resolvePath(bases.sourceBaseAbs, dir.source);
    if (await Fs.exists(sourceAbs)) filtered.push({ mode: mapping.mode, dir });
  }
  return filtered;
}

function resolveShardConfig(
  mapping: t.DeployTool.Config.EndpointYaml.Mapping,
  providerShards: t.OrbiterProvider['shards'] | undefined,
): { readonly total?: number; readonly requireAll?: boolean } {
  if (Is.num(mapping.shards?.total)) {
    return { total: mapping.shards?.total, requireAll: mapping.shards?.requireAll };
  }
  return { total: providerShards?.total, requireAll: undefined };
}
