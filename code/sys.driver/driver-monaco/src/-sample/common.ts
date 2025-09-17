import { pkg, Pkg } from '../common.ts';

export { Crdt, DocumentId } from '@sys/driver-automerge/web/ui';
export { Monaco } from '@sys/driver-monaco';
export { SplitPane } from '@sys/ui-react-components';
export * from '../ui/common.ts';

/**
 * Constants:
 */
const name = 'Schema:Sample';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  borderOpacity: 0.3,
} as const;
export const D = DEFAULTS;
export const STORAGE_KEY = { DEV: `dev:${D.name}.docid` };
