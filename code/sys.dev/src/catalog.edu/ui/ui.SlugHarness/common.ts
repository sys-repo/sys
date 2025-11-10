import { Crdt } from '@sys/driver-automerge/web/ui';
import { pkg, Pkg } from '../common.ts';

export { Traits } from '../../m.slug.traits/mod.ts';
export * from '../common.ts';

/**
 * Libs:
 */
export { Icons } from '../ui.Icons.ts';
export { Crdt };

/**
 * Constants:
 */
const name = 'SlugHarness';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  header: Crdt.UI.Layout.defaults.header,
  sidebar: Crdt.UI.Layout.defaults.sidebar,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
