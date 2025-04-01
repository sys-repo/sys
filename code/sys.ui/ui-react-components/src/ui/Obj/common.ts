import type { t } from './common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const theme: t.CommonTheme = 'Light';
export const DEFAULTS = {
  theme,
  font: { size: 12 },
  block: false,
  sortKeys: false,
  show: { rootSummary: false, nonenumerable: false },
} as const;
