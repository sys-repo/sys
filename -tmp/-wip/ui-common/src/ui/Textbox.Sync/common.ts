import { pkg, Str } from '../common.ts';

export * from '../common.ts';
export { TextInput } from '../Text.Input/mod.ts';

/**
 * Constants
 */
const name = 'Textbox.Sync';
export const DEFAULTS = {
  name,
  displayName: `${pkg.name}:${name}`,
  splice: Str.splice,
  diff: Str.diff,
} as const;
