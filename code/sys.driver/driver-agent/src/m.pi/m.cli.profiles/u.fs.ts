import { Fs, Schema, Str, type t, Yaml } from './common.ts';
import { PiFs } from '../u.fs.ts';
import { ProfileSchema } from './u.schema.ts';
import { ProfileYamlErrorCode, validateProfileYamlText } from './u.validate.ts';

const PROFILES_DIR = PiFs.configDir satisfies t.PiCliProfiles.Yaml.DirName;
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
      # pi profile: ${name}
      #
      # Typed Pi launcher policy.
      # Sandbox paths resolve relative to the current working directory.

      prompt:
        system: null  # override default system prompt

      sandbox:
        capability:
          read: []   # extra readable paths
          write: []  # extra writable paths
          env: {}    # extra environment variables
        context:
          include: []  # extra context files

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
        message: 'Profile config YAML file does not exist.',
        code: ProfileYamlErrorCode,
        pos: [0, 0],
      });
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    const read = await Fs.readText(path);
    if (!read.ok) {
      const err = Yaml.Error.synthetic({
        message: 'Unable to read profile config YAML file.',
        code: ProfileYamlErrorCode,
        pos: [0, 0],
      });
      return { ok: false, errors: Schema.Error.fromYaml([err]) };
    }

    return validateProfileYamlText(read.data ?? '');
  },

  async writeProfile(path: t.StringPath, doc: t.PiCliProfiles.Yaml.Profile) {
    await Fs.ensureDir(Fs.dirname(path));
    const text = ProfileSchema.stringify(doc);
    await Fs.write(path, text);
  },
} as const;
