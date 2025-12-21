import { type t, Fs, Schema, Str } from '../common.ts';
import { EndpointYamlErrorCode, validateEndpointYamlText } from './u.endpoints.validate.ts';

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
   * Read + validate an endpoint YAML file (FS wrapper).
   *
   * - Missing file → YAML error
   * - Read failure → YAML error
   * - Content validation → delegated to `validateEndpointYamlText`
   *
   * No throwing. Always returns a YamlCheck.
   */
  async validateYaml(path: t.StringPath): Promise<t.DeployTool.EndpointsFs.YamlCheck> {
    if (!(await Fs.exists(path))) {
      const err: t.Yaml.Error = {
        name: 'YAMLParseError',
        message: 'Endpoint YAML file does not exist.',
        code: EndpointYamlErrorCode,
        pos: [0, 0],
      };
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    const read = await Fs.readText(path);

    if (!read.ok) {
      const err: t.Yaml.Error = {
        name: 'YAMLParseError',
        message: 'Unable to read endpoint YAML file.',
        code: EndpointYamlErrorCode,
        pos: [0, 0],
      };
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    const checked = validateEndpointYamlText(read.data ?? '');
    if (!checked.ok) return checked;

    const errors: t.Yaml.Error[] = [];
    const baseDir = Fs.dirname(path);
    const mappings = checked.doc.mappings ?? [];

    for (let i = 0; i < mappings.length; i++) {
      const m = mappings[i];
      const sourceRaw = String(m?.dir?.source ?? '').trim();

      if (!sourceRaw) {
        errors.push({
          name: 'YAMLParseError',
          message: `mappings[${i}].dir.source is required.`,
          code: EndpointYamlErrorCode,
          pos: [0, 0],
        });
        continue;
      }

      const sourceAbs = sourceRaw.startsWith('/') ? sourceRaw : Fs.join(baseDir, sourceRaw);

      if (!(await Fs.exists(sourceAbs))) {
        errors.push({
          name: 'YAMLParseError',
          message:
            `mappings[${i}].dir.source does not exist: ${sourceRaw}\n` + `resolved: ${sourceAbs}`,
          code: EndpointYamlErrorCode,
          pos: [0, 0],
        });
      }
    }

    if (errors.length) {
      return { ok: false, errors: Schema.Error.fromYaml(errors) };
    }

    return checked;
  },
} as const;
