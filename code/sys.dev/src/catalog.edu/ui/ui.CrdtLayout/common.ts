import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

type P = t.CrdtLayoutProps;

/**
 * Libs:
 */
export { Crdt } from '@sys/driver-automerge/web/ui';
export { Media } from '@sys/ui-react-components';

/**
 * Constants:
 */
const name = 'Crdt.Layout';
const header: t.CrdtLayoutHeaderConfig = { visible: true, readOnly: false };
const sidebar: t.CrdtLayoutSidebarConfig = { visible: true, position: 'right', width: 340 };

export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  header,
  sidebar,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.name}` };
