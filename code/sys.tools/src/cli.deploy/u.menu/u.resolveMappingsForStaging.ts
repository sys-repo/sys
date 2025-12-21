import { type t, Fs, Path } from '../common.ts';

type ResolveMappingsResult =
  | { readonly ok: true; readonly mappings: readonly t.DeployTool.Staging.Mapping[] }
  | { readonly ok: false; readonly mappings: readonly t.DeployTool.Staging.Mapping[] };

/**
 * Read endpoint YAML and resolve mapping paths:
 * - source  → relative to endpoint YAML dir
 * - staging → relative to deploy root (config folder)
 *
 * Returns ok:false when YAML read fails (callers can decide how to handle).
 */
export async function resolveMappingsForStaging(args: {
  readonly cwd: t.StringDir;
  readonly yamlAbs: t.StringPath;
}): Promise<ResolveMappingsResult> {
  const { cwd, yamlAbs } = args;

  const yamlDir = Fs.dirname(String(yamlAbs)); // endpoint YAML folder
  const rootDir = String(cwd); // deploy root (config folder)

  type T = { mappings?: readonly t.DeployTool.Staging.Mapping[] };
  const res = await Fs.readYaml<T>(String(yamlAbs));
  const raw = res.ok ? (res.data?.mappings ?? []) : [];

  const resolved: readonly t.DeployTool.Staging.Mapping[] = raw.map((m) => {
    const src = Path.resolve(yamlDir, String(m.dir.source ?? ''));
    const dst = Path.resolve(rootDir, String(m.dir.staging ?? ''));
    return { ...m, dir: { ...m.dir, source: src, staging: dst } };
  });

  return res.ok ? { ok: true, mappings: resolved } : { ok: false, mappings: resolved };
}
