import { Num } from './common.ts';

export function shownCount(total: number, tail?: number) {
  return Num.Is.finite(tail) ? Math.min(total, Math.max(0, Math.floor(tail))) : total;
}

/** Read the newest supplied occurrences first without reordering the input. */
export function newest<E>(items: readonly E[], count: number): E[] {
  return items.slice(items.length - count).reverse();
}
