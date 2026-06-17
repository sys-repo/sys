import { pkg, Pkg, type t } from '../common.ts';

export * from '../common.ts';
export { Switch } from '../Buttons.Switch/mod.ts';

// Cycle-safe renderer seam: avoid importing the aggregate KeyValue lib object.
export { KeyValue as KeyValueUI } from '../KeyValue/ui.tsx';

/**
 * Constants:
 */
const name = 'KeyValue.Switches';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  switch: {
    width: 26,
    height: 14,
  } satisfies t.KeyValueSwitches.Item.SwitchOptions,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
