import type { t } from '../common.ts';

/**
 * Cacluation utilities.
 */
export const Calc = {
  showHr(prop: t.ModuleListProps['hr'], prev: string, next: string) {
    if (typeof prop === 'function') return prop({ prev, next });
    if (typeof prop === 'number') return Calc.showHrByDepth(prop, prev, next);
    return false; // default: no break.
  },

  showHrByDepth(depth: number, prev: string, next: string): boolean {
    if (typeof depth !== 'number') return false;
    if (typeof prev !== 'string' || typeof next !== 'string') return false;

    if (depth > 1) {
      const split = (value: string) => value.split('.').slice(0, depth).join('.');

      const parts = {
        prev: split(prev),
        next: split(next),
      };

      if (parts.prev !== parts.next) return true;
    }
    return false;
  },
};
