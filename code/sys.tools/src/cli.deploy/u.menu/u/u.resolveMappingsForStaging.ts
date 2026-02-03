import { type t, Fs, Path } from './common.ts';
import { expandShardTemplatePaths } from '../../u.shardTemplate.ts';

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
  const expanded = expandShardTemplatePaths({
    source,
    staging,
    total: mapping.shards?.total,
  });
  return expanded.map((dir) => ({ mode: mapping.mode, dir }));
}
