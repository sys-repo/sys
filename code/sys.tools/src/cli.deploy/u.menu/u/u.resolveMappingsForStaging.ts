import { type t, Fs, Is, Path } from './common.ts';

type ResolveMappingsResult =
  | { readonly ok: true; readonly mappings: readonly t.DeployTool.Staging.Mapping[] }
  | { readonly ok: false; readonly mappings: readonly t.DeployTool.Staging.Mapping[] };

/**
 * Read endpoint YAML and return mappings for staging.
 *
 * Returns ok:false when YAML read fails (callers can decide how to handle).
 */
export async function resolveMappingsForStaging(args: {
  cwd: t.StringDir;
  yamlPath: t.StringRelativeDir;
  yaml?: t.DeployTool.Config.EndpointYaml.Doc;
}): Promise<ResolveMappingsResult> {
  const { cwd } = args;
  const yamlAbs = Path.resolve(cwd, args.yamlPath);

  const res = args.yaml
    ? { ok: true as const, data: args.yaml }
    : await Fs.readYaml<t.DeployTool.Config.EndpointYaml.Doc>(String(yamlAbs));

  const raw = res.ok ? res.data?.mappings ?? [] : [];
  const resolved: t.DeployTool.Staging.Mapping[] = raw.flatMap((m) => expandShardMappings(m));

  return res.ok ? { ok: true, mappings: resolved } : { ok: false, mappings: resolved };
}

function expandShardMappings(
  mapping: t.DeployTool.Config.EndpointYaml.Mapping,
): t.DeployTool.Staging.Mapping[] {
  const source = String(mapping.dir.source ?? '').trim();
  const staging = String(mapping.dir.staging ?? '').trim();
  const base: t.DeployTool.Staging.Mapping = {
    mode: mapping.mode,
    dir: { source, staging },
  };

  const total = mapping.shards?.total;
  const hasTemplate = source.includes('<shard>') || source.includes('<shards>') ||
    staging.includes('<shard>') || staging.includes('<shards>');

  if (!hasTemplate) return [base];
  if (!Is.num(total) || !Number.isFinite(total) || total <= 0) return [base];

  const count = Math.floor(total);
  const mappings: t.DeployTool.Staging.Mapping[] = [];
  for (let index = 0; index < count; index += 1) {
    mappings.push({
      mode: base.mode,
      dir: {
        source: resolveShardTemplate(source, index, count),
        staging: resolveShardTemplate(staging, index, count),
      },
    });
  }
  return mappings;
}

function resolveShardTemplate(value: string, shard: number, total: number): string {
  return value.replaceAll('<shard>', String(shard)).replaceAll('<shards>', String(total));
}
