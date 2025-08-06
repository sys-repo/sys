import { pkg, Pkg } from '../common.ts';

export { Crdt, DocumentId } from '@sys/driver-automerge/ui';
export { Monaco } from '@sys/driver-monaco';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Monaco.Dev';
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const D = DEFAULTS;
export const STORAGE_KEY = { DEV: `dev:${D.name}.docid` };
