import { type t, D, Is } from './common.ts';

type P = t.ButtonProps;

/**
 * Helpers:
 */
export const Wrangle = {
  enabled(props: P) {
    const { enabled } = props;
    if (Is.bool(enabled)) return enabled;
    if (Is.func(enabled)) return enabled();
    return D.enabled;
  },
} as const;
