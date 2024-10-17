import { type t, R } from '../common.ts';

export * from '../common.ts';
export { UserAgent } from '../m.UserAgent/mod.ts';

/**
 * Defaults
 */
const modifiers: t.KeyboardModifierFlags = { shift: false, ctrl: false, alt: false, meta: false };

const state: t.KeyboardState = {
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
    return R.clone(state);
  },
  get modifiers() {
    return R.clone(modifiers);
  },
};
