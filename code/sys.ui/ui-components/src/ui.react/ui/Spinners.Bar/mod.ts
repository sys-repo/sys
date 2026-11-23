/**
 * @module
 * Clipped loading bar for indeterminate activity.
 */
import type { t } from './common.ts';
import { BarSpinner as UI } from './ui.tsx';

/**
 * Module entry for the bar activity indicator.
 */
export const BarSpinner: t.BarSpinner.Lib = Object.freeze({ UI });
