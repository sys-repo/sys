import { type t, Fs, Path, Schema, Str, Yaml } from '../common.ts';
import { ServeYamlErrorCode, validateServeYamlText } from './u.validate.ts';

const SERVE_DIR = '-config/serve' satisfies t.ServeTool.LocationYaml.DirName;
const SERVE_EXT = '.yaml' satisfies t.ServeTool.LocationYaml.Ext;

export const ServeFs = {
  dir: SERVE_DIR,
  ext: SERVE_EXT,

  /**
   * Get the relative file path for a location by name.
   */
  fileOf(name: string): t.StringPath {
    return `${SERVE_DIR}/${name}${SERVE_EXT}`;
  },

  /**
   * Canonical starting YAML for a new serve location.
   * Keep this minimal and schema-aligned.
   */
  initialYaml(name: string): string {
    return Str.dedent(
      `
      # serve location: ${name}
      #
      # A serve location defines:
      # - required display name
      # - directory to serve (relative to CLI cwd, or absolute)
      # - optional contentTypes filter (omit to serve all MIME types)
      # - optional remoteBundles for pulling remote content
      #
      # Paths are resolved relative to the CLI cwd.

      name: ${name}
      dir: .

      # contentTypes:
      #   - image/png
      #   - application/json

      # remoteBundles:
      #   - remote:
      #       dist: https://example.com/dist.json
      #     local:
      #       dir: bundles/example

      `,
    ).trimStart();
  },

  /**
   * Convenience helper that ensures the initial YAML is present at the given path.
   */
  async ensureInitialYaml(path: t.StringPath, name: string) {
    await Fs.ensureDir(Fs.dirname(path));
    if (await Fs.exists(path)) return;
    await Fs.write(path, ServeFs.initialYaml(name), { force: false });
  },

  /**
   * Read + validate a serve YAML file (FS wrapper).
   *
   * - Missing file → YAML error
   * - Read failure → YAML error
   * - Content validation → delegated to `validateServeYamlText`
   *
   * No throwing. Always returns a YamlCheck.
   */
  async validateYaml(path: t.StringPath): Promise<t.ServeTool.LocationYaml.YamlCheck> {
    if (!(await Fs.exists(path))) {
      const err = Yaml.Error.synthetic({
        message: 'Serve YAML file does not exist.',
        code: ServeYamlErrorCode,
        pos: [0, 0],
      });
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    const read = await Fs.readText(path);
    if (!read.ok) {
      const err = Yaml.Error.synthetic({
        message: 'Unable to read serve YAML file.',
        code: ServeYamlErrorCode,
        pos: [0, 0],
      });
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    return validateServeYamlText(read.data ?? '');
  },

  /**
   * Load a serve location from its YAML file.
   *
   * Resolves `dir` relative to the project root (cwd).
   * The cwd is derived as 2 levels up from the YAML file location.
   */
  async loadLocation(
    yamlPath: t.StringPath,
  ): Promise<t.ServeTool.LocationYaml.LoadResult> {
    const checked = await ServeFs.validateYaml(yamlPath);
    if (!checked.ok) return { ok: false, errors: checked.errors };

    const cwd = Path.resolve(Fs.dirname(yamlPath), '..', '..') as t.StringDir;
    const doc = checked.doc;

    // Resolve dir relative to cwd (project root), not the YAML file location.
    const resolvedDir = resolveDir(cwd, doc.dir);

    return {
      ok: true,
      cwd,
      location: {
        name: doc.name,
        dir: resolvedDir,
        contentTypes: doc.contentTypes,
        remoteBundles: doc.remoteBundles,
      },
    };
  },
} as const;

/**
 * Resolve a directory path relative to cwd.
 */
function resolveDir(cwd: t.StringDir, dir: t.StringDir): t.StringDir {
  const raw = String(dir ?? '').trim();
  if (!raw || raw === '.') return cwd;
  if (raw.startsWith('/')) return raw as t.StringDir;
  return Fs.join(cwd, Str.trimLeadingDotSlash(raw));
}
