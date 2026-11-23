/**
 * @module
 * Inline circular indicator for indeterminate activity.
 */
import type { t } from './common.ts';
import { CircularSpinner as UI } from './ui.tsx';

/**
 * Visual loading indicator. The spinner itself is not announced to screen readers.
 */
export const CircularSpinner: t.CircularSpinner.Lib = Object.freeze({ UI });
