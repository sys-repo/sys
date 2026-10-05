import { Fs, Is, Num, Path, type t } from '../common.ts';
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
 * Returns ok:false when YAML read or explicit shard validation fails.
 */
export async function resolveMappingsForStaging(args: {
  cwd: t.StringDir;
  yamlPath: t.StringPath;
  yaml?: t.DeployTool.Config.EndpointYaml.Doc;
}): Promise<ResolveMappingsResult> {
  const { cwd } = args;
  const yamlAbs = Path.resolve(cwd, args.yamlPath);

  const res = args.yaml
    ? { ok: true as const, data: args.yaml }
    : await Fs.readYaml<t.DeployTool.Config.EndpointYaml.Doc>(String(yamlAbs));

  if (!res.ok || !res.data?.staging) return { ok: false, mappings: [] };

  const raw = res.data.mappings ?? [];
  for (const mapping of raw) {
    if (mapping.shards !== undefined && !isValidShardConfig(mapping.shards)) {
      return { ok: false, mappings: [] };
    }
  }

  const bases = resolveBases(cwd, res.data);
  const standard: t.DeployTool.Staging.Mapping[] = [];
  for (const mapping of raw) {
    if (mapping.mode === 'index') continue;
    standard.push(...await expandShardMappings(mapping, bases));
  }

  const producedStaging = standard.map((mapping) =>
    resolvePath(bases.stagingBaseAbs, mapping.dir.staging)
  );
  const indexes: t.DeployTool.Staging.Mapping[] = [];
  for (const mapping of raw) {
    if (mapping.mode !== 'index') continue;
    indexes.push(...await expandShardMappings(mapping, bases, producedStaging));
  }

  return { ok: true, mappings: [...standard, ...indexes] };
}

function isValidShardConfig(value: unknown): boolean {
  if (!Is.record(value)) return false;

  const { total, requireAll } = value;
  return Num.Is.safeInt(total) && total > 0 && (requireAll === undefined || Is.bool(requireAll));
}

async function expandShardMappings(
  mapping: t.DeployTool.Config.EndpointYaml.Mapping,
  bases: ReturnType<typeof resolveBases>,
  producedStaging: readonly string[] = [],
): Promise<t.DeployTool.Staging.Mapping[]> {
  const source = String(mapping.dir.source ?? '');
  const staging = String(mapping.dir.staging ?? '');
  const total = mapping.shards?.total;
  const configuredRequireAll = mapping.shards?.requireAll;
  const expanded = expandShardTemplatePaths({
    source,
    staging,
    total,
    requireAll: configuredRequireAll,
  });

  const hasTemplate = includesShardTemplate(source) || includesShardTemplate(staging);
  const requireAll = shouldRequireAllShards({
    source,
    staging,
    total,
    requireAll: configuredRequireAll,
  });
  if (!hasTemplate || requireAll || !Num.Is.safeInt(total) || total < 1) {
    return expanded.map((dir) => ({ mode: mapping.mode, dir }));
  }

  const filtered: t.DeployTool.Staging.Mapping[] = [];
  for (const dir of expanded) {
    const sourceBase = mapping.mode === 'index' ? bases.stagingBaseAbs : bases.sourceBaseAbs;
    const sourceAbs = resolvePath(sourceBase, dir.source);
    const available = mapping.mode === 'index'
      ? producedStaging.some((output) => isGuaranteedStagingSource(sourceAbs, output))
      : await Fs.exists(sourceAbs);
    if (available) filtered.push({ mode: mapping.mode, dir });
  }
  return filtered;
}

function isGuaranteedStagingSource(source: string, producedOutput: string): boolean {
  return Path.Is.within(source, producedOutput);
}
