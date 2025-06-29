import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Libs:
 */
export { Crdt } from '@sys/driver-automerge/ui';
export { Media } from '@sys/ui-react-components';
export { Avatar } from '../ui.Avatar/mod.ts';

/**
 * Constants:
 */
const name = 'Sample';
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name) } as const;
export const D = DEFAULTS;
