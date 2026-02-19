import { type t, Fs, Path, pkg, Schema, Str, Yaml } from '../common.ts';
import { YamlConfig } from '@sys/yaml/cli';
import { PullTool } from '../t.namespace.ts';
import { PullYamlErrorCode, validatePullYamlText } from './u.validate.ts';

const ROOT = YamlConfig.File.fromPkg('-config', pkg).dir.name;
const CONFIG_DIR = `-config/${ROOT}.${PullTool.ID}` satisfies t.PullTool.ConfigYaml.DirName;
const CONFIG_EXT = '.yaml' satisfies t.PullTool.ConfigYaml.Ext;

export const PullFs = {
  dir: CONFIG_DIR,
  ext: CONFIG_EXT,

  fileOf(configName: string): t.StringPath {
    return `${CONFIG_DIR}/${configName}${CONFIG_EXT}`;
  },

  initialYaml(): string {
    return Str.dedent(
      `
      dir: .
      `,
    ).trimStart();
  },

  async ensureInitialYaml(path: t.StringPath, _configName: string) {
    await Fs.ensureDir(Fs.dirname(path));
    if (await Fs.exists(path)) return;
    await Fs.write(path, PullFs.initialYaml(), { force: false });
  },

  async validateYaml(path: t.StringPath): Promise<t.PullTool.ConfigYaml.YamlCheck> {
    if (!(await Fs.exists(path))) {
      const err = Yaml.Error.synthetic({
        message: 'Pull YAML file does not exist.',
        code: PullYamlErrorCode,
        pos: [0, 0],
      });
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    const read = await Fs.readText(path);
    if (!read.ok) {
      const err = Yaml.Error.synthetic({
        message: 'Unable to read Pull YAML file.',
        code: PullYamlErrorCode,
        pos: [0, 0],
      });
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    return validatePullYamlText(read.data ?? '');
  },

  async loadLocation(yamlPath: t.StringPath): Promise<t.PullTool.ConfigYaml.LoadResult> {
    const checked = await PullFs.validateYaml(yamlPath);
    if (!checked.ok) return { ok: false, errors: checked.errors };

    const cwd = resolveCwdFromYamlPath(yamlPath);
    const doc = checked.doc;
    const resolvedDir = resolveDir(cwd, doc.dir);

    return {
      ok: true,
      cwd,
      location: {
        dir: resolvedDir,
        remoteBundles: doc.remoteBundles,
      },
    };
  },
} as const;

function resolveCwdFromYamlPath(yamlPath: t.StringPath): t.StringDir {
  const depth = PullFs.dir.split('/').filter(Boolean).length;
  const parts = Array.from({ length: depth }, () => '..');
  return Path.resolve(Fs.dirname(yamlPath), ...parts) as t.StringDir;
}

function resolveDir(cwd: t.StringDir, dir: t.StringDir): t.StringDir {
  const raw = String(dir ?? '').trim();
  if (!raw || raw === '.') return cwd;
  if (raw.startsWith('/')) return raw as t.StringDir;
  return Fs.join(cwd, Str.trimLeadingDotSlash(raw));
}
