import type { t } from './common.ts';

type O = Record<string, unknown>;
type P = t.Patch;

/**
 * Value wrangling.
 */
export const Wrangle = {
  patchCallback(input?: t.ImmutableChangeOptionsInput<P>) {
    if (!input) return;
    if (typeof input === 'function') return input;
    if (typeof input.patches === 'function') return input.patches;
    return;
  },

  changeOptions<T extends O>(input?: t.ImmutableChangeOptionsInput<P>) {
    const fn = Wrangle.patchCallback(input);
    if (!fn) return;

    const patchCallback: t.A.PatchCallback<T> = (e) => fn(e);
    const options: t.A.ChangeOptions<T> = { patchCallback };
    return options;
  },
} as const;
