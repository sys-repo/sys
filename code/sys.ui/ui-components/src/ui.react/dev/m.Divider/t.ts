import type { t } from '../common.ts';

/**
 * Defaults to a 5px rule at 0.1 foreground alpha, extending 25px past each horizontal edge.
 * Owns 14px top / 10px bottom spacing; the host must allow the overhang.
 * Caller style composes last using css; raw undefined declarations clear matching defaults.
 * Margin: undefined does not clear expanded margins; pre-transforming style can discard clears.
 */
export type Props = { theme?: t.CommonTheme; style?: t.CssInput };
