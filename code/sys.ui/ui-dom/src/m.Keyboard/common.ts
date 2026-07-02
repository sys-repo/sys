import { Obj, type t } from '../common.ts';

export * from '../common.ts';
export { UserAgent } from '../m.UserAgent/mod.ts';

/**
 * Defaults
 */
const modifiers: t.Keyboard.Modifier.Flags = { shift: false, ctrl: false, alt: false, meta: false };

const state: t.Keyboard.State.Snapshot = {
  last: undefined,
  current: {
    modified: false,
    modifierKeys: { shift: [], ctrl: [], alt: [], meta: [] },
    modifiers,
    pressed: [],
  },
};

export const DEFAULTS = {
  get state() {
    return Obj.clone(state);
  },
  get modifiers() {
    return Obj.clone(modifiers);
  },
};
