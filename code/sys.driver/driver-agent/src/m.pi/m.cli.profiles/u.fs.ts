import { Fs, pkg, Schema, Str, type t, Yaml, YamlConfig } from './common.ts';
import { ProfileSetSchema } from './u.schema.ts';
import { ProfileSetYamlErrorCode, validateProfileSetYamlText } from './u.validate.ts';

const ROOT = YamlConfig.File.fromPkg('-config', pkg).dir.name;
const PROFILES_DIR = `-config/${ROOT}.pi.cli` satisfies t.PiCliProfiles.Yaml.DirName;
const PROFILES_EXT = '.yaml' satisfies t.PiCliProfiles.Yaml.Ext;

export const ProfilesFs = {
  dir: PROFILES_DIR,
  ext: PROFILES_EXT,

  fileOf(name: string): t.StringPath {
    return `${PROFILES_DIR}/${name}${PROFILES_EXT}`;
  },

  initialYaml(name = 'default'): string {
    return Str.dedent(
      `
      # environment profiles: ${name}
      #
      # Contains one or more named Pi environment profiles.
      # Args pass through to Pi.
      # Paths resolve relative to the CLI cwd.

      profiles:
        - name: default
          args: []
          read: []
          env: {}

      `,
    ).trimStart();
  },

  async ensureInitialYaml(path: t.StringPath, name = 'default') {
    await Fs.ensureDir(Fs.dirname(path));
    if (await Fs.exists(path)) return;
    await Fs.write(path, ProfilesFs.initialYaml(name), { force: false });
  },

  async validateYaml(path: t.StringPath): Promise<t.PiCliProfiles.Yaml.YamlCheck> {
    if (!(await Fs.exists(path))) {
      const err = Yaml.Error.synthetic({
        message: 'Environment profile YAML file does not exist.',
        code: ProfileSetYamlErrorCode,
        pos: [0, 0],
      });
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    const read = await Fs.readText(path);
    if (!read.ok) {
      const err = Yaml.Error.synthetic({
        message: 'Unable to read environment profile YAML file.',
        code: ProfileSetYamlErrorCode,
        pos: [0, 0],
      });
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    return validateProfileSetYamlText(read.data ?? '');
  },

  async writeProfileSet(path: t.StringPath, doc: t.PiCliProfiles.Yaml.ProfileSet) {
    await Fs.ensureDir(Fs.dirname(path));
    const text = ProfileSetSchema.stringify(doc);
    await Fs.write(path, text);
  },
} as const;
