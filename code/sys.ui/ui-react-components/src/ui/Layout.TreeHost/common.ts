import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

type P = t.TreeHost.Props;

export { Spinners } from '../Spinners/mod.ts';
export { Data as TreeData } from '../TreeView.Index.Data/mod.ts';
export { TreeView } from '../TreeView/mod.ts';

/**
 * Constants:
 */
const name = 'TreeHost';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  nav: {
    width: 320,
    animate: { duration: 180, ease: 'easeInOut' },
  } satisfies Required<t.TreeHost.Nav>,
  parts: {
    header: { background: false },
    nav: { background: false, motion: { kind: 'preset', preset: 'snappy' } },
    main: { background: true },
    footer: { background: false },
  } satisfies t.TreeHost.Parts,
  spinner: {
    backgroundOpacity: 0.2,
    backgroundBlur: 1,
    position: 'middle',
  } satisfies Omit<t.TreeHost.SlotSpinner, 'slot'>,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
