import { type t, Fs, pkg, Schema, Str, Yaml } from '../common.ts';
import { YamlConfig } from '@sys/yaml/cli';
import { CryptoTool } from '../t.namespace.ts';
import { CryptoYamlErrorCode, validateCryptoYamlText } from './u.validate.ts';

const ROOT = YamlConfig.File.fromPkg('-config', pkg).dir.name;
const CONFIG_DIR = `-config/${ROOT}.${CryptoTool.ID}` satisfies t.CryptoTool.ConfigYaml.DirName;
const CONFIG_EXT = '.yaml' satisfies t.CryptoTool.ConfigYaml.Ext;

export const CryptoFs = {
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
    await Fs.write(path, CryptoFs.initialYaml(configName), { force: false });
  },

  async validateYaml(path: t.StringPath): Promise<t.CryptoTool.ConfigYaml.YamlCheck> {
    if (!(await Fs.exists(path))) {
      const err = Yaml.Error.synthetic({
        message: 'Crypto YAML file does not exist.',
        code: CryptoYamlErrorCode,
        pos: [0, 0],
      });
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    const read = await Fs.readText(path);
    if (!read.ok) {
      const err = Yaml.Error.synthetic({
        message: 'Unable to read Crypto YAML file.',
        code: CryptoYamlErrorCode,
        pos: [0, 0],
      });
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    return validateCryptoYamlText(read.data ?? '');
  },
} as const;
