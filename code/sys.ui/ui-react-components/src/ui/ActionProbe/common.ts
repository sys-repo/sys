import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

export { Button } from '../Button/mod.ts';
export { Switch } from '../Buttons.Switch/mod.ts';
export { KeyValue } from '../KeyValue/mod.ts';
export { ObjectView } from '../ObjectView/mod.ts';
export { Spinners } from '../Spinners/mod.ts';
export { Icons } from '../ui.Icons.ts';

/**
 * Constants:
 */
const name = 'ActionProbe';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  borderRadius: 6,
  Probe: {
    actOn: ['Cmd+Enter', 'Cmd+Click'] satisfies t.ActionProbe.ActOnKey[],
    doubleClickPulse: 50 as t.Msecs,
  },
  Result: {
    sizeMode: 'auto' satisfies t.ActionProbe.ResultProps['sizeMode'],
    placeholder: 'Card Output' satisfies t.ActionProbe.ResultProps['placeholder'],
  },
  Persist: { key: ':action-card' },
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
