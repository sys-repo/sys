import type { t } from './common.ts';

export * from '../common.ts';
export { Is } from '../m.Is/mod.ts';
export { Signal } from '../m.Signal/mod.ts';

/**
 * Constants:
 */
export const levels = [
  'log',
  'info',
  'warn',
  'error',
  'debug',
] as const satisfies readonly t.LogLevel[];

export const CYAN = '#00c2ff';

/**
 * Defaults:
 */
export const D = {
  prefixColor: CYAN satisfies t.LogOptions['prefixColor'],
} as const;
