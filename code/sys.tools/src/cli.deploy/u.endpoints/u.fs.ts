import { Err, Fs, Path, pkg, Schema, type t, Yaml } from '../common.ts';
import { YamlConfig } from '@sys/yaml/cli';
import { resolveEndpointEnvRefs } from './u.env.ts';
import { EndpointYamlErrorCode, validateEndpointYamlAst } from './u.validate.ts';
import { ensureInitialYaml, initialYaml } from './u.yaml.ts';
import { isHomePath, resolveBases, resolvePath } from './u.resolve.ts';
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
   * - Env refs → inspected purely, then resolved only when present
   * - Content validation → delegated to `validateEndpointYamlAst`
   *
   * No throwing. Always returns a YamlCheck.
   */
  async validateYaml(
    path: t.StringPath,
    options: { cwd?: t.StringDir } = {},
  ): Promise<t.DeployTool.Endpoint.Fs.YamlCheck> {
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

    const ast = Yaml.parseAst(read.data ?? '');
    if (ast.errors?.length) return validateEndpointYamlAst(ast);

    const cwd = options.cwd ?? resolveCwdFromYamlPath(path);
    const resolved = await resolveEndpointEnvRefs(ast, { cwd });
    if (!resolved.ok) return { ok: false, errors: Schema.Error.fromYaml([...resolved.errors]) };

    const checked = validateEndpointYamlAst(ast);
    if (!checked.ok) return checked;

    const errors: t.Yaml.Error[] = [];
    const mappings = mappingChecksOf(checked.doc);
    const stagingRaw = String(checked.doc.staging?.dir ?? '').trim();
    validateStagingPath(stagingRaw || './staging', 'staging.dir', errors);

    for (const entry of mappings) {
      const sourceRaw = String(entry.mapping?.dir?.source ?? '').trim();
      if (!sourceRaw) {
        errors.push(
          Yaml.Error.synthetic({
            message: `${entry.label}.dir.source is required.`,
            code: EndpointYamlErrorCode,
            pos: [0, 0],
          }),
        );
      }

      const mappingStaging = String(entry.mapping?.dir?.staging ?? '').trim();
      validateStagingPath(mappingStaging, `${entry.label}.dir.staging`, errors);
    }

    if (errors.length) {
      return { ok: false, errors: Schema.Error.fromYaml(errors) };
    }

    let bases: ReturnType<typeof resolveBases>;
    try {
      bases = resolveBases(cwd, checked.doc);
    } catch (error) {
      errors.push(
        pathResolutionError('source.dir', String(checked.doc.source?.dir ?? '.').trim(), error),
      );
      return { ok: false, errors: Schema.Error.fromYaml(errors) };
    }

    for (const entry of mappings) {
      const sourceRaw = String(entry.mapping?.dir?.source ?? '').trim();
      const mappingStaging = String(entry.mapping?.dir?.staging ?? '').trim();
      const shards = entry.mapping.shards;
      const expanded = expandShardTemplatePaths({
        source: sourceRaw,
        staging: mappingStaging,
        total: shards?.total,
        requireAll: shards?.requireAll,
      });
      const requireAll = shouldRequireAllShards({
        source: sourceRaw,
        staging: mappingStaging,
        total: shards?.total,
        requireAll: shards?.requireAll,
      });

      let found = 0;
      let resolutionFailed = false;
      let firstResolved: { readonly input: string; readonly absolute: string } | undefined;
      for (const expandedPath of expanded) {
        let sourceAbs: string;
        try {
          sourceAbs = resolvePath(bases.sourceBaseAbs, expandedPath.source);
        } catch (error) {
          errors.push(
            pathResolutionError(`${entry.label}.dir.source`, expandedPath.source, error),
          );
          resolutionFailed = true;
          break;
        }

        firstResolved ??= { input: expandedPath.source, absolute: sourceAbs };
        if (await Fs.exists(sourceAbs)) {
          found += 1;
          continue;
        }

        if (requireAll) {
          errors.push(
            Yaml.Error.synthetic({
              message:
                `${entry.label}.dir.source does not exist: ${expandedPath.source}\nresolved: ${sourceAbs}`,
              code: EndpointYamlErrorCode,
              pos: [0, 0],
            }),
          );
          break;
        }
      }

      if (!requireAll && !resolutionFailed && firstResolved && found === 0) {
        errors.push(
          Yaml.Error.synthetic({
            message:
              `${entry.label}.dir.source does not exist: ${firstResolved.input}\nresolved: ${firstResolved.absolute}`,
            code: EndpointYamlErrorCode,
            pos: [0, 0],
          }),
        );
      }
    }

    if (errors.length) {
      return { ok: false, errors: Schema.Error.fromYaml(errors) };
    }

    return checked;
  },
} as const;

function validateStagingPath(input: string, label: string, errors: t.Yaml.Error[]): void {
  if (isHomePath(input) || Path.Is.absolute(input)) {
    errors.push(
      Yaml.Error.synthetic({
        message: `${label} must be relative (or '.'): ${input}`,
        code: EndpointYamlErrorCode,
        pos: [0, 0],
      }),
    );
  }

  if (input.includes('..')) {
    errors.push(
      Yaml.Error.synthetic({
        message: `${label} must not contain '..': ${input}`,
        code: EndpointYamlErrorCode,
        pos: [0, 0],
      }),
    );
  }
}

function pathResolutionError(label: string, input: string, error: unknown): t.Yaml.Error {
  const detail = Err.summary(error, { cause: true, stack: false });
  return Yaml.Error.synthetic({
    message: `${label} could not be resolved: ${input}\n${detail}`,
    code: EndpointYamlErrorCode,
    pos: [0, 0],
  });
}

function mappingChecksOf(
  doc: t.DeployTool.Config.EndpointYaml.Doc,
): readonly {
  readonly label: string;
  readonly mapping: t.DeployTool.Config.EndpointYaml.Mapping;
}[] {
  return (doc.mappings ?? []).map((mapping, index) => ({
    label: `mappings[${index}]`,
    mapping,
  }));
}

function resolveCwdFromYamlPath(path: t.StringPath): t.StringDir {
  const depth = EndpointsFs.dir.split('/').filter(Boolean).length;
  const parts = Array.from({ length: depth }, () => '..');
  return Path.resolve(Fs.dirname(path), ...parts);
}
