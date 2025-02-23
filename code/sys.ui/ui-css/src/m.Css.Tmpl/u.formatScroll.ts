import type { t } from './common.ts';
import { mergeAndReplace } from './u.ts';

/**
 * Sets up vertical scrolling including iOS momentum scrolling.
 * See:
 *    https://css-tricks.com/snippets/css/momentum-scrolling-on-ios-overflow-elements/
 */
export function formatScroll(key: string, value: unknown, target: t.CssProps) {
  if (value === true) {
    const styles = {
      overflowX: 'hidden',
      overflowY: 'scroll',
      WebkitOverflowScrolling: 'touch',
    };
    mergeAndReplace(key, styles, target);
  }

  if (value === false) {
    const styles = { overflow: 'hidden' };
    mergeAndReplace(key, styles, target);
  }
}
