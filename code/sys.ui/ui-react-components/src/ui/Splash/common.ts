import { type t, pkg, Pkg } from '../common.ts';

export { useKeyboard } from '@sys/ui-react-devharness/hooks';
export * from '../common.ts';
export { KeyValue } from '../KeyValue/mod.ts';

type P = t.Splash.Props;

/**
 * Constants:
 */
const name = 'Splash';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  qs: '?dev' satisfies P['qs'],
  keyboardEnabled: true satisfies P['keyboardEnabled'],
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
