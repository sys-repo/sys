import { c } from '../common.ts';

const DEFAULT_OMISSION = '…';

/** Format a formatter-inserted omission marker as dim gray structural context. */
export function omission(text: string = DEFAULT_OMISSION): string {
  if (!text) return '';
  return c.dim(c.gray(text));
}
