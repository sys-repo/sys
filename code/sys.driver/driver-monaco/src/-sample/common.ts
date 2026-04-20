import { Pkg, pkg } from '../common.ts';

export { Crdt, DocumentId } from '@sys/driver-automerge/web/ui';
export { SplitPane } from '@sys/ui-react-components/layout/split-pane';
export { Monaco } from '../m.Monaco/mod.ts';
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
export const STORAGE_KEY = { DEV: `dev:${D.displayName}.docid` };
