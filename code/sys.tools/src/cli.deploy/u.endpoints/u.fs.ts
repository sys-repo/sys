import { type t, Fs, Is, Obj, Path, pkg, Schema, Yaml } from '../common.ts';
import { YamlConfig } from '@sys/yaml/cli';
import { EndpointYamlErrorCode, validateEndpointYamlText } from './u.validate.ts';
import { ensureInitialYaml, initialYaml } from './u.yaml.ts';
import { resolveBases, resolvePath } from './u.resolve.ts';
import { expandShardTemplatePaths, shouldRequireAllShards } from '../u.shardTemplate.ts';

const ROOT = YamlConfig.File.fromPkg('-config', pkg).dir.name;
const ENDPOINTS_DIR = `-config/${ROOT}.deploy` satisfies t.DeployTool.Endpoint.Fs.DirName;
const ENDPOINTS_EXT = '.yaml' satisfies t.DeployTool.Endpoint.Fs.Ext;

export const EndpointsFs = {
  dir: ENDPOINTS_DIR,
  ext: ENDPOINTS_EXT,
  initialYaml,
  ensureInitialYaml,

  fileOf(name: string): t.StringPath {
    return `${ENDPOINTS_DIR}/${name}${ENDPOINTS_EXT}`;
  },

  /**
   * Read + validate an endpoint YAML file (FS wrapper).
   *
   * - Missing file → YAML error
   * - Read failure → YAML error
   * - Content validation → delegated to `validateEndpointYamlText`
   *
   * No throwing. Always returns a YamlCheck.
   */
  async validateYaml(path: t.StringPath): Promise<t.DeployTool.Endpoint.Fs.YamlCheck> {
    if (!(await Fs.exists(path))) {
      const err = Yaml.Error.synthetic({
        message: 'Endpoint YAML file does not exist.',
        code: EndpointYamlErrorCode,
        pos: [0, 0],
      });
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    const read = await Fs.readText(path);
    if (!read.ok) {
      const err = Yaml.Error.synthetic({
        message: 'Unable to read endpoint YAML file.',
        code: EndpointYamlErrorCode,
        pos: [0, 0],
      });
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    const checked = validateEndpointYamlText(read.data ?? '');
    if (!checked.ok) return checked;

    const cwd = resolveCwdFromYamlPath(path);
    const bases = resolveBases(cwd, checked.doc);

    const errors: t.Yaml.Error[] = [];
    const mappings = checked.doc.mappings ?? [];
    const providerShards =
      checked.doc.provider?.kind === 'orbiter' ? checked.doc.provider?.shards : undefined;

    {
      const stagingRaw = String(checked.doc.staging?.dir ?? '').trim();
      const stagingEffective = stagingRaw || './staging';
      const stagingExpanded = Fs.Tilde.expand(stagingEffective);

      if (Path.Is.absolute(stagingExpanded)) {
        errors.push(
          Yaml.Error.synthetic({
            message: `staging.dir must be relative (or '.'): ${stagingRaw || stagingEffective}`,
            code: EndpointYamlErrorCode,
            pos: [0, 0],
          }),
        );
      }

      if (stagingExpanded.includes('..')) {
        errors.push(
          Yaml.Error.synthetic({
            message: `staging.dir must not contain '..': ${stagingRaw || stagingEffective}`,
            code: EndpointYamlErrorCode,
            pos: [0, 0],
          }),
        );
      }
    }

    validateProviderShards(providerShards, errors);

    for (let i = 0; i < mappings.length; i++) {
      const m = mappings[i];
      const sourceRaw = String(m?.dir?.source ?? '').trim();

      if (!sourceRaw) {
        errors.push(
          Yaml.Error.synthetic({
            message: `mappings[${i}].dir.source is required.`,
            code: EndpointYamlErrorCode,
            pos: [0, 0],
          }),
        );
        continue;
      }

      const stagingRaw = String(m?.dir?.staging ?? '').trim();
      const shards = resolveShardConfig(m, providerShards);
      const expanded = expandShardTemplatePaths({
        source: sourceRaw,
        staging: stagingRaw,
        total: shards.total,
        requireAll: shards.requireAll,
      });
      const requireAll = shouldRequireAllShards({
        source: sourceRaw,
        staging: stagingRaw,
        total: shards.total,
        requireAll: shards.requireAll,
      });

      let found = 0;
      for (const item of expanded) {
        const sourceAbs = resolvePath(bases.sourceBaseAbs, item.source);
        if (await Fs.exists(sourceAbs)) {
          found += 1;
          continue;
        }

        if (requireAll) {
          errors.push(
            Yaml.Error.synthetic({
              message: `mappings[${i}].dir.source does not exist: ${item.source}\nresolved: ${sourceAbs}`,
              code: EndpointYamlErrorCode,
              pos: [0, 0],
            }),
          );
          break;
        }
      }

      if (!requireAll && expanded.length > 0 && found === 0) {
        const sourceAbs = resolvePath(bases.sourceBaseAbs, expanded[0]!.source);
        errors.push(
          Yaml.Error.synthetic({
            message: `mappings[${i}].dir.source does not exist: ${expanded[0]!.source}\nresolved: ${sourceAbs}`,
            code: EndpointYamlErrorCode,
            pos: [0, 0],
          }),
        );
      }

      {
        const stagingExpanded = Fs.Tilde.expand(stagingRaw);

        if (Path.Is.absolute(stagingExpanded)) {
          errors.push(
            Yaml.Error.synthetic({
              message: `mappings[${i}].dir.staging must be relative (or '.'): ${stagingRaw}`,
              code: EndpointYamlErrorCode,
              pos: [0, 0],
            }),
          );
        }

        if (stagingExpanded.includes('..')) {
          errors.push(
            Yaml.Error.synthetic({
              message: `mappings[${i}].dir.staging must not contain '..': ${stagingRaw}`,
              code: EndpointYamlErrorCode,
              pos: [0, 0],
            }),
          );
        }
      }
    }

    if (errors.length) {
      return { ok: false, errors: Schema.Error.fromYaml(errors) };
    }

    return checked;
  },
} as const;

function resolveShardConfig(
  mapping: t.DeployTool.Config.EndpointYaml.Mapping,
  providerShards: t.OrbiterProvider['shards'] | undefined,
): { readonly total?: number; readonly requireAll?: boolean } {
  if (Is.num(mapping.shards?.total)) {
    return { total: mapping.shards?.total, requireAll: mapping.shards?.requireAll };
  }
  return { total: providerShards?.total, requireAll: undefined };
}

function validateProviderShards(
  shards: t.OrbiterProvider['shards'] | undefined,
  errors: t.Yaml.Error[],
) {
  if (!shards) return;

  const total = shards.total;
  if (!Is.num(total) || !Number.isFinite(total) || total <= 0 || !Number.isInteger(total)) {
    errors.push(
      Yaml.Error.synthetic({
        message: `provider.shards.total must be a positive integer: ${String(total)}`,
        code: EndpointYamlErrorCode,
        pos: [0, 0],
      }),
    );
    return;
  }

  if (shards.only?.length) {
    const seen = new Set<number>();
    for (const value of shards.only) {
      if (!Is.num(value) || !Number.isInteger(value)) {
        errors.push(
          Yaml.Error.synthetic({
            message: `provider.shards.only must contain integers: ${String(value)}`,
            code: EndpointYamlErrorCode,
            pos: [0, 0],
          }),
        );
        continue;
      }
      if (value < 0 || value >= total) {
        errors.push(
          Yaml.Error.synthetic({
            message: `provider.shards.only out of range (0..${total - 1}): ${String(value)}`,
            code: EndpointYamlErrorCode,
            pos: [0, 0],
          }),
        );
        continue;
      }
      if (seen.has(value)) {
        errors.push(
          Yaml.Error.synthetic({
            message: `provider.shards.only has duplicate: ${String(value)}`,
            code: EndpointYamlErrorCode,
            pos: [0, 0],
          }),
        );
        continue;
      }
      seen.add(value);
    }
  }

  if (shards.siteIds) {
    for (const [key, value] of Obj.entries(shards.siteIds)) {
      const index = Number.parseInt(String(key), 10);
      if (!Is.num(index) || !Number.isInteger(index)) {
        errors.push(
          Yaml.Error.synthetic({
            message: `provider.shards.siteIds key must be integer: ${String(key)}`,
            code: EndpointYamlErrorCode,
            pos: [0, 0],
          }),
        );
        continue;
      }
      if (index < 0 || index >= total) {
        errors.push(
          Yaml.Error.synthetic({
            message: `provider.shards.siteIds key out of range (0..${total - 1}): ${String(key)}`,
            code: EndpointYamlErrorCode,
            pos: [0, 0],
          }),
        );
        continue;
      }
      if (!Is.str(value) || !value.trim()) {
        errors.push(
          Yaml.Error.synthetic({
            message: `provider.shards.siteIds[${String(key)}] must be a non-empty string`,
            code: EndpointYamlErrorCode,
            pos: [0, 0],
          }),
        );
      }
    }
  }
}

function resolveCwdFromYamlPath(path: t.StringPath): t.StringDir {
  const depth = EndpointsFs.dir.split('/').filter(Boolean).length;
  const parts = Array.from({ length: depth }, () => '..');
  return Path.resolve(Fs.dirname(path), ...parts) as t.StringDir;
}
