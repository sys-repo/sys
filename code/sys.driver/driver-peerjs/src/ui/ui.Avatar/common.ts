import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Libs:
 */
export { Crdt } from '@sys/driver-automerge/web/ui';
export { Media } from '@sys/ui-react-components';

/**
 * Constants:
 */
const name = 'Avatar';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  aspectRatio: '16/9',
  borderRadius: 6,
  borderWidth: 1,
  borderColor: 1,
  flipped: false,
  muted: true,
} as const;
export const D = DEFAULTS;
