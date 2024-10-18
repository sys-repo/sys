/**
 * Cacluation utilities.
 */
export const Calc = {
  showHr(depth: number, prev: string, next: string): boolean {
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
