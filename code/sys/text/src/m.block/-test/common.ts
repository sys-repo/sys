import { type t } from '../../-test.ts';

/**
 * Defaults:
 */
const markers = {
  start: '# >>> block',
  end: '# <<< block',
} satisfies t.TextBlock.Markers;

export const D = { markers } as const;
