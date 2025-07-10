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
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const D = DEFAULTS;

export const PATH = {
  DEV: {
    BASE: ['dev'],
    MODE: ['dev', 'mode'],
    VIEW: ['dev', 'view'],
    FILES: ['dev', 'files'],
    FILES_REF: ['dev', 'files.ref'],
    NOTES_REF: ['dev', 'notes.ref'],
  },
};

const ALL_VIEWS: t.SampleView[] = ['Room', 'Notes', 'FileShare', 'Debug'];
export const VIEWS = {
  ALL: ALL_VIEWS,
};
