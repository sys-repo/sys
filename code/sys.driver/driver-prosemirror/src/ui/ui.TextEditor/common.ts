import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

export { toAutomergeHandle } from '@sys/driver-automerge';

/**
 * Constants:
 */
const name = 'TextEditor';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  autoFocus: false,
  readOnly: false,
  scroll: true,
  singleLine: false,
} as const;
export const D = DEFAULTS;
