import { Pkg, pkg } from '../common.ts';

export * from '../common.ts';
export type * as t from './common.t.ts';

export { Color, css } from '@sys/ui-css';
export { Admonition } from '@sys/ui-components/react/admonition';
export { Anchor } from '@sys/ui-components/react/anchor';
export { Bullet } from '@sys/ui-components/react/bullet';
export { Button } from '@sys/ui-components/react/button';
export { KeyValue } from '@sys/ui-components/react/key-value';
export { Spinners } from '@sys/ui-components/react/spinners';

/**
 * Constants:
 */
const name = 'Passkey';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  debug: false,
  view: 'panel',
  spinner: { width: 24, height: 3 },
  sections: { actions: true, status: true, context: true },
  pendingReason: 'Operation in progress',
  layout: { kind: 'spaced', columnGap: 12, rowGap: 4, align: 'start' },
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
