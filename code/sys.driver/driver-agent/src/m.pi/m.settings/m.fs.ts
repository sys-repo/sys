import { Fs, type t } from './common.ts';
import { resolve } from './u.resolve.ts';
import { PiSettingsSchema } from './u.schema.ts';

const SETTINGS_DIR = '.pi' as const;
const SETTINGS_FILE = 'settings.json' as const;

/**
 * Filesystem helpers for wrapper-owned Pi settings.
 */
export const SettingsFs: t.PiSettings.Fs = {
  dirOf(cwd) {
    return Fs.join(cwd, SETTINGS_DIR) as t.StringDir;
  },

  pathOf(cwd) {
    return Fs.join(SettingsFs.dirOf(cwd), SETTINGS_FILE) as t.StringPath;
  },

  async write(input) {
    const path = SettingsFs.pathOf(input.cwd);
    const doc = resolve(input.settings);
    const checked = PiSettingsSchema.validate(doc);
    if (!checked.ok) throw new Error('Invalid wrapper-owned Pi settings document.');

    await Fs.ensureDir(Fs.dirname(path));
    await Fs.write(path, PiSettingsSchema.stringify(checked.doc));
    return path;
  },
};
