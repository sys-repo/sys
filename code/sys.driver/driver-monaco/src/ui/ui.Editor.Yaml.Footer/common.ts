import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Monaco.Editor.Yaml.Footer';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  visible: true,
} as const;
export const D = DEFAULTS;
export const STORAGE_KEY = { DEV: `dev:${D.name}` };
