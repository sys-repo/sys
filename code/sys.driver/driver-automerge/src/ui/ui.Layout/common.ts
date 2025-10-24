import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Libs:
 */
export { DocumentId } from '../ui.DocumentId/mod.ts';
export { Repo } from '../ui.Repo/mod.ts';
export { useRev } from '../use/use.Rev.ts';

/**
 * Constants:
 */
const name = 'Crdt.Layout';

export const defaults: t.LayoutDefaults = {
  get header() {
    return { visible: true, readOnly: false };
  },
  get sidebar() {
    return { visible: true, position: 'right' as const, width: 340 };
  },
  get cropmarks() {
    return { borderOpacity: 0.08, subjectOnly: false };
  },
};

export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  theme: 'Dark' satisfies t.CommonTheme,
  edgeBorderOpacity: 0.2,
  spinningTransition: 'opacity 80ms ease',
  ...defaults,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
