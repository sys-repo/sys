import { Fs, Obj, type t } from './common.ts';
import { resolve } from './u.resolve.ts';
import { PiSettingsSchema } from './u.schema.ts';

type SettingsJson = t.JsonMap;

const SETTINGS_DIR = ['.pi', 'agent'] as const;
const SETTINGS_FILE = 'settings.json' as const;

/**
 * Filesystem helpers for wrapper-owned Pi settings.
 */
export const SettingsFs: t.PiSettings.Fs = {
  dirOf(cwd) {
    return Fs.join(cwd, ...SETTINGS_DIR) as t.StringDir;
  },

  pathOf(cwd) {
    return Fs.join(SettingsFs.dirOf(cwd), SETTINGS_FILE) as t.StringPath;
  },

  async write(input) {
    const path = SettingsFs.pathOf(input.cwd);
    const doc = resolve(input.settings);
    const checked = PiSettingsSchema.validate(doc);
    if (!checked.ok) throw new Error('Invalid wrapper-owned Pi settings fragment.');

    const existing = await readExisting(path);
    const next: SettingsJson = { ...existing, ...checked.doc };
    const written = await Fs.writeJson(path, next);
    if (written.error) throw new Error(`Could not write Pi settings: ${written.error.message}`);
    return path;
  },
};

/**
 * Helpers:
 */
async function readExisting(path: t.StringPath): Promise<SettingsJson> {
  const read = await Fs.readJson<unknown>(path);
  if (!read.exists) return {};
  if (!read.ok) {
    throw new Error(`Cannot merge existing Pi settings: ${read.error?.message ?? path}`);
  }
  if (!Obj.isRecord<SettingsJson>(read.data)) {
    throw new Error(`Cannot merge existing Pi settings: expected a JSON object at ${path}`);
  }
  return read.data;
}
