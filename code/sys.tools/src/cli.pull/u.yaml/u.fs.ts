import { type t, Fs, pkg, Schema, Str, Yaml } from '../common.ts';
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

  initialYaml(configName: string): string {
    return Str.dedent(
      `
      name: ${configName}
      `,
    ).trimStart();
  },

  async ensureInitialYaml(path: t.StringPath, configName: string) {
    await Fs.ensureDir(Fs.dirname(path));
    if (await Fs.exists(path)) return;
    await Fs.write(path, PullFs.initialYaml(configName), { force: false });
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
} as const;
