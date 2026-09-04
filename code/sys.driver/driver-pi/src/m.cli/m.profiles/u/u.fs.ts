import { Fs, Schema, Str, type t, Yaml } from '../common.ts';
import { PiFs } from '../../../m.core/u.fs.ts';
import { ProfileSchema } from '../u.schema/mod.ts';
import { ProfileYamlErrorCode, validateProfileYamlText } from './u.validate.ts';

const PROFILES_DIR = PiFs.configDir satisfies t.PiCliProfiles.Yaml.DirName;
const PROFILES_EXT = '.yaml' satisfies t.PiCliProfiles.Yaml.Ext;

export const ProfilesFs = {
  dir: PROFILES_DIR,
  ext: PROFILES_EXT,

  fileOf(name: string): t.StringPath {
    return `${PROFILES_DIR}/${name}${PROFILES_EXT}`;
  },

  initialYaml(): string {
    return Str.dedent(
      `
      #
      # Launcher profile. Docs: https://jsr.io/@sys/driver-pi
      #

      sandbox:
        capability:
          read: []
          write: []
          env: {}
        context:
          append: [] # extra files loaded after ./AGENTS.md and ./SYSTEM.md

      tools:
        remove: { enabled: true, recursive: true }
        move: { enabled: true }
        copy: { enabled: true }
        ocr:
          pdf:
            enabled: false
            languages: [eng]
            defaultLanguage: eng
            dpi: 200
            maxPages: 10
            maxChars: 60000
            timeoutMs: 120000

      `,
    ).trimStart();
  },

  async ensureInitialYaml(path: t.StringPath) {
    await Fs.ensureDir(Fs.dirname(path));
    if (await Fs.exists(path)) return;
    await Fs.write(path, ProfilesFs.initialYaml(), { force: false });
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
