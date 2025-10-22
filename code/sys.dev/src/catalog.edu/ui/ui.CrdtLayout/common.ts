import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

type P = t.CrdtLayoutProps;

/**
 * Libs:
 */
export { Crdt } from '@sys/driver-automerge/web/ui';
export { Media, Spinners } from '@sys/ui-react-components';

/**
 * Constants:
 */
const name = 'Crdt.Layout';
const header: t.CrdtLayoutHeader = { visible: true, readOnly: false };
const sidebar: t.CrdtLayoutSidebar = { visible: true, position: 'right', width: 340 };
const cropmarks: t.CrdtLayoutCropmarks = { borderOpacity: 0.08, subjectOnly: false };

export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  theme: 'Dark' satisfies t.CommonTheme,
  header,
  sidebar,
  edgeBorderOpacity: 0.2,
  cropmarks,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.name}` };
