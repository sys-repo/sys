import { pkg, Pkg } from '../common.ts';
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
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const D = DEFAULTS;

export const PATH = {
  DEBUG: {
    BASE: ['debug'],
    VIEW: ['debug', 'view'],
    FILES: ['debug', 'files'],
    FILES_REF: ['debug', 'files.ref'],
    NOTES_REF: ['debug', 'notes.ref'],
  },
};
