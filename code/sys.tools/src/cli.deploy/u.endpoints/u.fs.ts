import { type t, Fs, Path, Schema, Yaml } from '../common.ts';
import { EndpointYamlErrorCode, validateEndpointYamlText } from './u.validate.ts';
import { ensureInitialYaml, initialYaml } from './u.yaml.ts';

const ENDPOINTS_DIR = '-endpoints' satisfies t.DeployTool.Endpoint.Fs.DirName;
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

    const errors: t.Yaml.Error[] = [];
    const baseDir = Fs.dirname(path);
    const mappings = checked.doc.mappings ?? [];

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

      const sourceExpanded = Fs.Tilde.expand(sourceRaw);
      const sourceAbs = Path.Is.absolute(sourceExpanded)
        ? sourceExpanded
        : Path.resolve(baseDir, sourceExpanded);

      if (!(await Fs.exists(sourceAbs))) {
        errors.push(
          Yaml.Error.synthetic({
            message: `mappings[${i}].dir.source does not exist: ${sourceRaw}\nresolved: ${sourceAbs}`,
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
