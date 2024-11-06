import { CssUtil } from './u.css.ts';
import { toMinWidth, toWidth } from './u.size.ts';
import { Value } from './u.value.ts';

/**
 * Helpers
 */
export const Util = {
  Value,
  Css: { ...CssUtil, toWidth, toMinWidth },
} as const;

export const Wrangle = {
  selection(el?: HTMLInputElement | null) {
    const start = el?.selectionStart ?? -1;
    const end = el?.selectionEnd ?? -1;
    return { start, end };
  },
} as const;
