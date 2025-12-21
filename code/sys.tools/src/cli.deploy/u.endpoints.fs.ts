import { type t, Str, Fs, Schema, Yaml } from './common.ts';
import { EndpointYamlSchema } from './u.endpoint.schema.ts';

type FsReadOk = { readonly ok: true; readonly data: Uint8Array | string };
type FsReadErr = { readonly ok: false; readonly error: unknown };
type FsReadResult = FsReadOk | FsReadErr;

/**
 * Fixed `yaml` ErrorCode required to construct a `YAMLError`.
 *
 * This value is intentionally stable and semantically inert.
 * In this system, all human meaning lives in `message`; the
 * `code` exists solely to satisfy the upstream error shape.
 */
const YAML_CODE: t.Yaml.Error['code'] = 'BAD_ALIAS';
const ENDPOINTS_DIR = '-endpoints' satisfies t.DeployTool.EndpointsFs.DirName;
const ENDPOINTS_EXT = '.yaml' satisfies t.DeployTool.EndpointsFs.Ext;

export const EndpointsFs = {
  dir: ENDPOINTS_DIR,
  ext: ENDPOINTS_EXT,

  fileOf(name: string): t.StringPath {
    return `${ENDPOINTS_DIR}/${name}${ENDPOINTS_EXT}`;
  },

  /**
   * Canonical starting YAML for a new endpoint.
   * Keep this minimal and schema-aligned.
   */
  initialYaml(name: string): string {
    return Str.dedent(
      `
      # deploy endpoint: ${name}

      mappings: []
    `,
    ).trimStart();
  },

  async ensureInitialYaml(path: t.StringPath, name: string) {
    await Fs.ensureDir(Fs.dirname(path));
    if (await Fs.exists(path)) return;
    await Fs.write(path, EndpointsFs.initialYaml(name), { force: false });
  },

  /**
   * Read + parse + validate an endpoint YAML file.
   *
   * - Missing file → YAML error
   * - Read failure → YAML error
   * - Parse errors → YAML errors
   * - toJS diagnostics → YAML errors
   * - Schema violations → schema errors
   *
   * No throwing. Always returns a YamlCheck.
   */
  async validateYaml(path: t.StringPath): Promise<t.DeployTool.EndpointsFs.YamlCheck> {
    if (!(await Fs.exists(path))) {
      const err: t.Yaml.Error = {
        name: 'YAMLParseError',
        message: 'Endpoint YAML file does not exist.',
        code: YAML_CODE,
        pos: [0, 0],
      };
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    const read = (await Fs.read(path)) as unknown as FsReadResult;
    if (!read.ok) {
      const err: t.Yaml.Error = {
        name: 'YAMLParseError',
        message: 'Unable to read endpoint YAML file.',
        code: YAML_CODE,
        pos: [0, 0],
      };
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    const text = typeof read.data === 'string' ? read.data : new TextDecoder().decode(read.data);
    const ast = Yaml.parseAst(text);
    if (ast.errors?.length) {
      return {
        ok: false,
        errors: Schema.Error.fromYaml(ast.errors),
      };
    }

    const js = Yaml.toJS<t.DeployTool.Config.EndpointYaml.Doc>(ast);

    if (!js.ok) {
      const yamlErrors = Yaml.Diagnostic.toYamlErrors([...js.errors]);
      return {
        ok: false,
        errors: Schema.Error.fromYaml(yamlErrors),
      };
    }

    if (js.data === undefined) {
      const err: t.Yaml.Error = {
        name: 'YAMLParseError',
        message: 'YAML conversion produced no value.',
        code: YAML_CODE,
        pos: [0, 0],
      };
      return {
        ok: false,
        errors: Schema.Error.fromYaml([err]),
      };
    }

    const checked = EndpointYamlSchema.validate(js.data);
    if (!checked.ok) {
      return {
        ok: false,
        errors: Schema.Error.fromSchema(ast, checked.errors),
      };
    }

    return {
      ok: true,
      doc: js.data,
    };
  },
} as const;
