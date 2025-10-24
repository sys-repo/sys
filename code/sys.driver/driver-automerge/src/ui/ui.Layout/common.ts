import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Libs:
 */
export { DocumentId } from '../ui.DocumentId/mod.ts';
export { Repo } from '../ui.Repo/mod.ts';

/**
 * Constants:
 */
const name = 'Crdt.Layout';
const header: t.LayoutHeader = { visible: true, readOnly: false };
const sidebar: t.LayoutSidebar = { visible: true, position: 'right', width: 340 };
const cropmarks: t.LayoutCropmarks = { borderOpacity: 0.08, subjectOnly: false };

export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  theme: 'Dark' satisfies t.CommonTheme,
  header,
  sidebar,
  cropmarks,
  edgeBorderOpacity: 0.2,
  spinningTransition: 'opacity 80ms ease',
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.name}` };
