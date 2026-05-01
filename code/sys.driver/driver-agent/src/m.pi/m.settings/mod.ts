/**
 * @module
 * Wrapper-owned Pi settings.
 *
 * This module models and materializes the subset of Pi `settings.json`
 * that `@sys/driver-agent/pi` controls under the git-rooted Pi agent dir.
 *
 * Profile YAML remains the human-edited policy surface.
 * Pi settings are derived integration state for the Pi runtime.
 */
import type { t } from './common.ts';
import { SettingsFs } from './m.fs.ts';
import { resolve } from './u.resolve.ts';

/** Wrapper-owned Pi settings surface. */
export const Settings: t.PiSettings.Lib = {
  Fs: SettingsFs,
  resolve,
};
